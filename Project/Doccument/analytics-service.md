# Analytics Service

## Vai trò

Microservice cung cấp **dữ liệu thống kê và insight** cho dashboard người dùng và admin. Tính toán Plan vs Actual, phát hiện "giờ vàng tập trung" dựa trên lịch sử học thực tế. Là service read-heavy, không ghi dữ liệu nghiệp vụ.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Plan vs Actual** | So sánh `schedule_blocks` (kế hoạch) với `actual_sessions` (thực tế) |
| **Peak focus hours** | Phân tích giờ học có focus_score cao nhất theo lịch sử 7-30 ngày |
| **Goal completion rate** | % tasks đã hoàn thành theo từng goal |
| **Weekly summary** | Tổng giờ học theo tuần, streak ngày học liên tiếp |
| **Ghi actual session** | Nhận start/stop từ Scheduler Service → lưu vào TimescaleDB |
| **Admin reports** | Aggregate toàn hệ thống (tổng user active, total hours logged) |

---

## Giao tiếp

- **Inbound:** TCP từ API Gateway; event `analytics.session.log` từ Scheduler Service
- **Outbound:** Không emit sang service khác. Read-only với ngoài.

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/microservices` | TCP listener |
| `@nestjs/typeorm` + `typeorm` | Kết nối cả PostgreSQL (schedule_blocks) và TimescaleDB (actual_sessions) |
| `timescaledb` | Hypertable cho actual_sessions, time-bucket queries |
| `dayjs` | Tính toán date ranges, streak logic |
| `ioredis` | Cache kết quả aggregate (TTL 10 phút) |

---

## Database Schema

```sql
-- TimescaleDB (extend PostgreSQL, cùng instance hoặc riêng)
CREATE TABLE actual_sessions (
  time          TIMESTAMPTZ NOT NULL,           -- start time (hypertable key)
  user_id       UUID NOT NULL,
  task_id       UUID,
  block_id      UUID,                            -- schedule_block tương ứng
  duration_min  INTEGER NOT NULL,
  focus_score   SMALLINT DEFAULT NULL,           -- 1-5, user tự đánh giá (optional)
  completed     BOOLEAN DEFAULT false
);

SELECT create_hypertable('actual_sessions', 'time');
CREATE INDEX idx_sessions_user ON actual_sessions(user_id, time DESC);
```

---

## Queries chính

```sql
-- Plan vs Actual (7 ngày gần nhất)
SELECT
  DATE(sb.planned_start) AS date,
  SUM(t.duration_min)    AS planned_min,
  COALESCE(SUM(a.duration_min), 0) AS actual_min
FROM schedule_blocks sb
JOIN tasks t ON t.id = sb.task_id
LEFT JOIN actual_sessions a ON a.block_id = sb.id
WHERE sb.user_id = $1
  AND sb.planned_start >= NOW() - INTERVAL '7 days'
GROUP BY date ORDER BY date;

-- Peak focus hours (time-bucket 1 giờ, 30 ngày)
SELECT
  time_bucket('1 hour', time) AS hour_bucket,
  AVG(focus_score)            AS avg_focus,
  COUNT(*)                    AS session_count
FROM actual_sessions
WHERE user_id = $1
  AND time >= NOW() - INTERVAL '30 days'
  AND focus_score IS NOT NULL
GROUP BY hour_bucket
ORDER BY avg_focus DESC
LIMIT 5;

-- Streak ngày học liên tiếp
WITH daily AS (
  SELECT DISTINCT DATE(time) AS study_date
  FROM actual_sessions
  WHERE user_id = $1
  ORDER BY study_date DESC
)
-- ... window function tính streak
```

---

## Message Patterns

```typescript
// Ghi dữ liệu (từ Scheduler Service)
'analytics.session.log'           // Lưu actual session sau khi user stop timer

// Đọc dữ liệu (từ API Gateway → user dashboard)
'analytics.summary.weekly'        // Tổng giờ học tuần, streak, completion rate
'analytics.planvsactual.get'      // Plan vs Actual theo date range
'analytics.peakhours.get'         // Top 5 giờ tập trung cao nhất
'analytics.goal.progress'         // % hoàn thành của từng goal

// Admin only
'analytics.admin.overview'        // Tổng user active, total hours hệ thống
'analytics.admin.user.report'     // Report chi tiết 1 user
```

---

## Cấu trúc Module

```
analytics-service/
├── src/
│   ├── session/
│   │   ├── session.service.ts         # Ghi actual_sessions
│   │   └── session.entity.ts          # TypeORM TimescaleDB entity
│   ├── dashboard/
│   │   ├── dashboard.service.ts       # Plan vs Actual, weekly summary
│   │   └── peak-hours.service.ts      # Peak focus hour calculation
│   ├── goal/
│   │   └── goal-progress.service.ts   # Completion rate per goal
│   ├── admin/
│   │   └── admin-report.service.ts    # System-wide aggregates
│   ├── cache/
│   │   └── analytics-cache.service.ts # Redis cache layer
│   ├── analytics.controller.ts
│   └── main.ts
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...           # PostgreSQL (schedule_blocks, tasks)
TIMESCALE_URL=postgresql://...          # TimescaleDB (actual_sessions)
REDIS_URL=redis://localhost:6379
TCP_PORT=3004
ANALYTICS_CACHE_TTL_SECONDS=600        # 10 phút
PEAK_HOURS_LOOKBACK_DAYS=30
```

---

## Notes

- TimescaleDB có thể là cùng PostgreSQL instance với extension `timescaledb` — không cần server riêng khi mới bắt đầu.
- Cache Redis TTL 10 phút cho mọi aggregate query — invalidate khi có `analytics.session.log` mới từ user đó.
- `focus_score` là optional — nếu user không đánh giá, peak hours tính bằng `session_count` thay vì `avg_focus`.
- Phase 2: Khi đủ data (>30 sessions/user) → thêm simple linear regression để predict peak hours chính xác hơn.
