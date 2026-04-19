# Notification Service

## Vai trò

Microservice chịu trách nhiệm **gửi mọi loại thông báo** ra ngoài hệ thống — push notification, email. Là worker service thuần async: chỉ nhận jobs từ BullMQ queue, không xử lý business logic, không có state nghiệp vụ.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Push notification** | Gửi FCM (Android) / APNs (iOS) / Web Push |
| **Email** | Gửi email transactional (OTP, schedule summary, reminder) |
| **Reminder scheduler** | Nhắc nhở trước khi task bắt đầu (configurable: 5/10/15 phút) |
| **Schedule change notify** | Thông báo khi lịch bị auto-shift hoặc re-prioritize |
| **AI job complete notify** | Thông báo khi AI decompose goal xong, tasks sẵn sàng |
| **Device token management** | Lưu/cập nhật push token của user theo device |

---

## Giao tiếp

- **Inbound:** Chỉ nhận jobs từ BullMQ queue (`notification-jobs`). Không nhận TCP trực tiếp.
- Các service emit event vào queue:
  - User Service → OTP email
  - Scheduler Service → schedule change, reminder
  - AI Service → decompose complete

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/bull` + `bull` | BullMQ consumer |
| `firebase-admin` | FCM push notification (Android + Web) |
| `@parse/node-apn` | APNs push notification (iOS) |
| `nodemailer` | Gửi email qua SMTP |
| `@nestjs/typeorm` | Lưu device tokens, notification history |
| `handlebars` | Email template rendering |
| `ioredis` | Queue backend |

---

## Database Schema

```sql
CREATE TABLE device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    VARCHAR(10) NOT NULL,   -- 'ios' | 'android' | 'web'
  is_active   BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE TABLE notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  type        VARCHAR(50) NOT NULL,   -- 'push' | 'email'
  template    VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'sent', -- 'sent' | 'failed'
  sent_at     TIMESTAMPTZ DEFAULT now()
);
```

---

## BullMQ Job Payloads

```typescript
// Queue: 'notification-jobs'

// Push notification
{
  name: 'send-push',
  data: {
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>   // deep link payload
  }
}

// Email
{
  name: 'send-email',
  data: {
    to: string,
    template: 'otp' | 'schedule-summary' | 'reminder' | 'ai-done',
    vars: Record<string, any>       // template variables
  }
}

// Scheduled reminder (delayed job)
{
  name: 'send-push',
  data: { userId, title: 'Sắp đến giờ học!', body: taskTitle },
  opts: { delay: minutesBefore * 60 * 1000 }
}
```

---

## Email Templates (Handlebars)

```
templates/
├── otp.hbs              # OTP reset password
├── schedule-summary.hbs # Tóm tắt lịch tuần
├── reminder.hbs         # Nhắc nhở task sắp đến
└── ai-done.hbs          # AI đã phân rã xong goal
```

---

## Cấu trúc Module

```
notification-service/
├── src/
│   ├── processors/
│   │   ├── push.processor.ts        # @Process('send-push')
│   │   └── email.processor.ts       # @Process('send-email')
│   ├── push/
│   │   ├── fcm.service.ts           # Firebase Admin SDK
│   │   └── apns.service.ts          # APNs
│   ├── email/
│   │   ├── email.service.ts         # Nodemailer
│   │   └── template.service.ts      # Handlebars render
│   ├── device-token/
│   │   ├── device-token.service.ts  # CRUD push tokens
│   │   └── device-token.entity.ts
│   └── main.ts                      # Chỉ Bull worker, không TCP
```

---

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# APNs
APNS_KEY_ID=...
APNS_TEAM_ID=...
APNS_PRIVATE_KEY_PATH=...
APNS_BUNDLE_ID=com.yourapp.studyplan

# Email
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@studyplan.app
```

---

## Notes

- Service không expose TCP port. Hoàn toàn queue-driven.
- Khi FCM/APNs trả về lỗi token không hợp lệ → tự động set `device_tokens.is_active = false`.
- Reminder job là **delayed BullMQ job** — tạo khi schedule_block được assign, delay = `planned_start - reminderOffset`.
- Nếu user cập nhật lịch (auto-shift) → cancel delayed job cũ (bằng `job.id`), tạo job mới với thời gian mới.
- `notification_log` giữ 30 ngày để debug; không dùng cho nghiệp vụ.
