# User Service

## Vai trò

Microservice quản lý **danh tính, xác thực, và phân quyền** của toàn hệ thống. Là nơi duy nhất phát hành JWT token. Các service khác không tự xác thực — họ trust token đã được Gateway verify.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Đăng ký / Đăng nhập** | Tạo tài khoản, verify password, phát hành token |
| **JWT management** | Phát access token (15m) + refresh token (7d), rotation |
| **Quản lý profile** | CRUD thông tin cá nhân, timezone, preferences |
| **RBAC** | Gán role `admin` / `client`, kiểm tra quyền |
| **Admin user management** | Admin xem danh sách user, khóa/mở tài khoản |
| **Đổi mật khẩu / Quên mật khẩu** | Gửi OTP qua email (emit event sang Notification Service) |

---

## Giao tiếp

- **Inbound:** Nhận message từ API Gateway qua TCP transport
- **Outbound:** Emit event `notification.send` sang Notification Service (fire-and-forget) khi cần gửi email OTP

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/microservices` | NestJS Microservice (TCP listener) |
| `@nestjs/jwt` | Tạo và verify JWT |
| `@nestjs/typeorm` + `typeorm` | ORM kết nối PostgreSQL |
| `bcrypt` | Hash password |
| `class-validator` | Validate DTO nội bộ |
| `redis` / `ioredis` | Lưu refresh token (TTL 7d), blacklist token |

---

## Database Schema

```sql
-- PostgreSQL
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  role        VARCHAR(20) DEFAULT 'client',   -- 'admin' | 'client'
  timezone    VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  preferences JSONB DEFAULT '{}',             -- pomodoro settings, theme, ...
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**Redis keys:**
```
refresh_token:{userId}     → token string  (TTL 7d)
blacklist:{jti}            → "1"           (TTL = thời gian còn lại của access token)
otp:{email}                → otp_code      (TTL 5m)
```

---

## Message Patterns (nhận từ Gateway)

```typescript
'user.register'          // Tạo tài khoản mới
'user.login'             // Đăng nhập → trả về { accessToken, refreshToken }
'user.refresh'           // Đổi refresh token → access token mới
'user.logout'            // Blacklist token
'user.profile.get'       // Lấy thông tin profile
'user.profile.update'    // Cập nhật profile / preferences
'user.password.change'   // Đổi mật khẩu (cần oldPassword)
'user.password.forgot'   // Gửi OTP reset password
'user.password.reset'    // Xác nhận OTP + đặt mật khẩu mới

// Admin only
'user.admin.list'        // Danh sách user (có filter, pagination)
'user.admin.toggle'      // Khóa / mở tài khoản
```

---

## Cấu trúc Module

```
user-service/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts        # Login, register, token logic
│   │   ├── token.service.ts       # JWT sign/verify, Redis refresh token
│   │   └── otp.service.ts         # Generate & verify OTP
│   ├── user/
│   │   ├── user.service.ts        # CRUD user, admin operations
│   │   ├── user.entity.ts         # TypeORM entity
│   │   └── user.repository.ts
│   ├── user.controller.ts         # @MessagePattern handlers
│   └── main.ts                    # createMicroservice({ transport: Transport.TCP })
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/studyplan
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRES_IN=7d
TCP_PORT=3001
```

---

## Notes

- Refresh token được lưu Redis thay vì DB để dễ revoke toàn bộ session của 1 user.
- `preferences` JSONB lưu các setting cá nhân (Pomodoro duration, break time, notification preferences) — tránh alter table mỗi lần thêm setting.
- Admin không thể tự đổi role của chính mình.
