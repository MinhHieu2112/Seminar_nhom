# Calendar Service

## Vai trò

Microservice quản lý **lịch bận (busy slots)** của người dùng và tính toán **các khoảng trống (free slots)** để Scheduler Service dùng khi xếp lịch học. Là nguồn sự thật duy nhất về thời gian khả dụng của user.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **CRUD busy slots** | Tạo/sửa/xóa lịch bận (cố định hoặc one-time) |
| **Recurrence expansion** | Expand recurring rule ra các ngày cụ thể trong khoảng thời gian |
| **Tính free slots** | Từ busy slots + working hours config → danh sách khoảng trống |
| **Conflict detection** | Phát hiện busy slot mới chồng lên schedule_blocks hiện tại |
| **Google Calendar sync** | OAuth2 import busy events từ Google Calendar (optional) |
| **Notify on conflict** | Emit event sang Scheduler Service khi phát hiện conflict |

---

## Giao tiếp

- **Inbound:** Nhận message từ API Gateway (TCP)
- **Outbound:**
  - Emit `scheduler.conflict.detected` → Scheduler Service khi busy slot mới tạo conflict
  - Query nội bộ từ Scheduler Service: `calendar.freeslots.get`

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/microservices` | TCP listener |
| `@nestjs/typeorm` + `typeorm` | ORM PostgreSQL |
| `rrule` | Parse và expand RRULE recurrence (RFC 5545) |
| `dayjs` + `dayjs/plugin/timezone` | Xử lý timezone, tính toán time ranges |
| `redis` / `ioredis` | Cache free_slots (TTL 5 phút, invalidate khi có busy slot mới) |
| `googleapis` | Google Calendar OAuth2 API (optional sync) |

---

## Database Schema

```sql
CREATE TABLE busy_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  is_fixed        BOOLEAN DEFAULT false,       -- true = recurring, false = one-time
  recurrence_rule TEXT,                        -- RRULE string, null nếu one-time
  source          VARCHAR(50) DEFAULT 'manual', -- 'manual' | 'google_calendar'
  external_id     VARCHAR(255),                -- Google event ID nếu sync
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_busy_slots_user_range ON busy_slots(user_id, start_at, end_at);
```

---

## Free Slot Calculation Logic

```
Input:
  - user_id
  - date_range: { from, to }
  - working_hours: { start: "07:00", end: "22:00" } (từ user.preferences)

Steps:
  1. Expand recurrence rules trong date_range → danh sách busy intervals
  2. Merge overlapping busy intervals (sort + sweep)
  3. Lấy complement trong working_hours mỗi ngày
  4. Filter khoảng trống có duration >= min_slot_duration (mặc định 30 phút)

Output: FreeSlot[]
  { date, start_at, end_at, duration_min }
```

**Cache key:** `freeslots:{userId}:{from}:{to}` — TTL 5 phút, xóa khi user tạo/sửa/xóa busy slot.

---

## Message Patterns

```typescript
'calendar.busyslot.create'       // Tạo busy slot mới
'calendar.busyslot.update'       // Cập nhật
'calendar.busyslot.delete'       // Xóa
'calendar.busyslot.list'         // Lấy danh sách busy slots của user

'calendar.freeslots.get'         // Tính và trả về free slots trong khoảng ngày
                                 // (Dùng bởi Scheduler Service)

'calendar.google.connect'        // Bắt đầu OAuth2 flow Google Calendar
'calendar.google.sync'           // Import busy events từ Google Calendar
```

---

## Cấu trúc Module

```
calendar-service/
├── src/
│   ├── busy-slot/
│   │   ├── busy-slot.service.ts       # CRUD + recurrence expansion
│   │   ├── busy-slot.entity.ts
│   │   └── recurrence.util.ts         # rrule expand helper
│   ├── free-slot/
│   │   ├── free-slot.service.ts       # Tính free slots, cache logic
│   │   └── interval-merge.util.ts     # Merge overlapping intervals
│   ├── google/
│   │   └── google-calendar.service.ts # OAuth2 sync
│   ├── calendar.controller.ts         # @MessagePattern handlers
│   └── main.ts
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
TCP_PORT=3002
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
MIN_FREE_SLOT_MINUTES=30
```

---

## Notes

- Khi busy slot mới được tạo, service tự động kiểm tra conflict với `schedule_blocks` hiện tại (query sang Scheduler Service hoặc đọc từ shared DB tùy kiến trúc). Nếu có conflict → emit event để Scheduler xử lý auto-shift.
- Timezone của user được lưu trong `users.timezone` — mọi tính toán thời gian đều convert về timezone đó trước khi trả ra.
