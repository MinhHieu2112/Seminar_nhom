# Scheduler Service

## Vai trò

Microservice **trung tâm của hệ thống** — nhận goals từ người dùng, gọi AI Service để phân rã thành tasks, sau đó tự động xếp tasks vào các free slots theo thuật toán scheduling. Xử lý auto-shift và re-prioritize khi lịch thay đổi.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Goal management** | CRUD learning goals của user |
| **Task management** | CRUD tasks (sau khi AI phân rã), cho phép user chỉnh sửa |
| **Trigger AI decompose** | Gửi job vào queue để AI Service phân rã goal → tasks |
| **Scheduling** | Xếp tasks vào free slots, áp dụng Pomodoro, tránh heavy tasks liên tiếp |
| **Auto-shift** | Khi có busy slot mới conflict → shift các schedule blocks bị ảnh hưởng |
| **Re-prioritize** | Gọi AI re-prioritize khi không đủ slot, hoặc user yêu cầu |
| **Session tracking** | Nhận start/stop từ user, lưu actual session |

---

## Giao tiếp

- **Inbound:** TCP từ API Gateway; event `scheduler.conflict.detected` từ Calendar Service; job result từ AI Service qua Queue
- **Outbound:**
  - `calendar.freeslots.get` → Calendar Service
  - Enqueue jobs vào BullMQ (AI decompose, reschedule)
  - Emit `notification.send` → Notification Service khi schedule xong hoặc bị thay đổi

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/microservices` | TCP listener |
| `@nestjs/typeorm` + `typeorm` | ORM PostgreSQL |
| `@nestjs/bull` + `bull` | BullMQ job queue (AI jobs, reschedule jobs) |
| `dayjs` | Tính toán time slots, Pomodoro intervals |
| `redis` / `ioredis` | Queue backend |

---

## Database Schema

```sql
CREATE TABLE goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  deadline    DATE,
  status      VARCHAR(20) DEFAULT 'active',   -- 'active' | 'completed' | 'paused'
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  title        TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  priority     SMALLINT DEFAULT 3,             -- 1 (thấp) → 5 (cao)
  type         VARCHAR(20) DEFAULT 'theory',   -- 'theory' | 'practice'
  status       VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'scheduled' | 'done' | 'skipped'
  source       VARCHAR(20) DEFAULT 'ai',       -- 'ai' | 'manual'
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE schedule_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  planned_start   TIMESTAMPTZ NOT NULL,
  planned_end     TIMESTAMPTZ NOT NULL,
  pomodoro_index  SMALLINT DEFAULT 1,           -- pomodoro thứ mấy của task
  status          VARCHAR(20) DEFAULT 'planned', -- 'planned' | 'done' | 'missed' | 'shifted'
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blocks_user_time ON schedule_blocks(user_id, planned_start, planned_end);
```

---

## Scheduling Algorithm (High-level)

```
Input: tasks[] (sorted by priority DESC, deadline ASC)
       free_slots[] (từ Calendar Service)

For each task:
  1. Tìm free_slot đủ duration
  2. Check heavy-task rule:
     - Nếu slot liền trước cũng là task type=theory priority>=4
       → Tìm slot tiếp theo, hoặc xen task practice/break
  3. Split thành pomodoro blocks (25min work + 5min break)
  4. Assign → tạo schedule_block records
  5. Nếu không còn slot trước deadline → đánh dấu OVERFLOW
     → Enqueue re-prioritize job

Auto-shift (khi nhận event conflict):
  1. Lấy tất cả blocks có planned_start trong khoảng bị conflict
  2. Sort by planned_start ASC
  3. Shift từng block sang free slot tiếp theo (greedy)
  4. Nếu không đủ chỗ → giữ nguyên + emit notification "không thể auto-shift"
```

---

## Message Patterns

```typescript
'scheduler.goal.create'           // Tạo goal mới → trigger AI decompose job
'scheduler.goal.list'             // Danh sách goals của user
'scheduler.goal.update'           // Cập nhật goal
'scheduler.goal.delete'           // Xóa goal và tasks liên quan

'scheduler.task.list'             // Danh sách tasks của goal
'scheduler.task.update'           // User chỉnh sửa task (title, duration, priority)
'scheduler.task.delete'           // Xóa task

'scheduler.schedule.generate'     // Xếp lịch (sau khi AI decompose xong)
'scheduler.schedule.view'         // Lấy schedule_blocks trong khoảng ngày
'scheduler.schedule.autoshift'    // Trigger auto-shift thủ công
'scheduler.schedule.reprioritize' // Trigger re-prioritize qua AI

'scheduler.session.start'         // User bắt đầu học (ghi actual start time)
'scheduler.session.stop'          // User kết thúc → lưu actual_sessions
```

---

## BullMQ Jobs

```typescript
// Queue: 'ai-jobs'
{ name: 'decompose-goal', data: { goalId, userId, goalTitle, deadline } }
{ name: 'reprioritize',   data: { userId, goalId, availableHours } }

// Queue: 'scheduler-jobs'
{ name: 'reschedule-user', data: { userId, fromDate } }
```

---

## Cấu trúc Module

```
scheduler-service/
├── src/
│   ├── goal/
│   │   ├── goal.service.ts
│   │   └── goal.entity.ts
│   ├── task/
│   │   ├── task.service.ts
│   │   └── task.entity.ts
│   ├── schedule/
│   │   ├── schedule.service.ts        # Scheduling algorithm
│   │   ├── schedule-block.entity.ts
│   │   ├── pomodoro.util.ts           # Split task → pomodoro blocks
│   │   └── autoshift.service.ts       # Auto-shift logic
│   ├── session/
│   │   └── session.service.ts         # Ghi actual_sessions
│   ├── queue/
│   │   └── ai-job.producer.ts         # Enqueue AI jobs
│   ├── scheduler.controller.ts
│   └── main.ts
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
TCP_PORT=3003
POMODORO_WORK_MIN=25
POMODORO_SHORT_BREAK_MIN=5
POMODORO_LONG_BREAK_MIN=15
POMODORO_LONG_BREAK_AFTER=4
```

---

## Notes

- AI decompose chạy **async** — sau khi goal được tạo, user nhận notification khi tasks sẵn sàng. Không block request.
- `schedule_blocks` bị xóa và tạo lại mỗi lần re-schedule (idempotent). Lưu lại lịch sử qua status `shifted`.
- Actual sessions ghi vào **TimescaleDB** (qua Analytics Service), không ghi vào PostgreSQL chính.
