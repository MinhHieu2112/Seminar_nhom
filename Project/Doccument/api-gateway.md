# API Gateway Service

## Vai trò

API Gateway là **điểm vào duy nhất (single entry point)** của toàn bộ hệ thống. Đây là REST API server, chịu trách nhiệm nhận request từ client (Web/Mobile), xác thực, phân quyền, rồi **forward sang các microservice nội bộ** thông qua NestJS ClientProxy (TCP/Redis transport).

Không chứa business logic. Chỉ route, guard, và transform.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Authentication** | Xác thực JWT access token trên mọi request |
| **Authorization (RBAC)** | Phân quyền `admin` / `client` qua Guard |
| **Request routing** | Forward request đến đúng microservice qua ClientProxy |
| **Rate limiting** | Giới hạn request/phút per user |
| **Request validation** | Validate DTO đầu vào (class-validator) |
| **Response transform** | Chuẩn hóa response format trả về client |
| **Error handling** | Bắt exception từ microservice, map về HTTP status code |

---

## Giao tiếp

```
Client (HTTP/REST)
      ↓
  API Gateway  (NestJS REST)
      ↓ TCP / Redis transport
  Microservices (NestJS Microservice)
```

- **Inbound:** REST HTTP từ client
- **Outbound:** `ClientProxy.send()` (request-response) và `ClientProxy.emit()` (fire-and-forget) đến các microservice

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/common`, `@nestjs/core` | NestJS framework core |
| `@nestjs/microservices` | ClientProxy để gọi microservice |
| `@nestjs/jwt` | Verify JWT access token |
| `@nestjs/passport` + `passport-jwt` | JWT Guard strategy |
| `class-validator`, `class-transformer` | DTO validation & transform |
| `@nestjs/throttler` | Rate limiting per IP / per user |
| `helmet` | HTTP security headers |
| `compression` | Gzip response |

---

## Cấu trúc Module

```
api-gateway/
├── src/
│   ├── auth/
│   │   ├── jwt.strategy.ts        # Passport JWT strategy
│   │   ├── jwt-auth.guard.ts      # Global auth guard
│   │   └── roles.guard.ts         # RBAC guard
│   ├── user/
│   │   ├── user.controller.ts     # Route /users/**
│   │   └── user.proxy.ts          # ClientProxy → user-service
│   ├── calendar/
│   │   ├── calendar.controller.ts
│   │   └── calendar.proxy.ts
│   ├── scheduler/
│   │   ├── scheduler.controller.ts
│   │   └── scheduler.proxy.ts
│   ├── analytics/
│   │   ├── analytics.controller.ts
│   │   └── analytics.proxy.ts
│   ├── common/
│   │   ├── interceptors/response-transform.interceptor.ts
│   │   ├── filters/rpc-exception.filter.ts   # Map RpcException → HTTP
│   │   └── decorators/roles.decorator.ts
│   └── app.module.ts
```

---

## Các message pattern expose ra ngoài

```typescript
// Ví dụ controller route → forward sang microservice
@Post('goals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('client')
createGoal(@Body() dto: CreateGoalDto, @CurrentUser() user: User) {
  return this.schedulerProxy.send('scheduler.goal.create', { dto, userId: user.id });
}
```

---

## Environment Variables

```env
JWT_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=...
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Transport endpoints
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=3001
CALENDAR_SERVICE_PORT=3002
SCHEDULER_SERVICE_PORT=3003
ANALYTICS_SERVICE_PORT=3004
NOTIFICATION_SERVICE_PORT=3005
AI_SERVICE_PORT=3006
```

---

## Notes

- Mọi microservice trả về `RpcException` khi lỗi → Gateway filter convert sang HTTP 4xx/5xx tương ứng.
- Không truy cập database trực tiếp.
- Access token TTL ngắn (15 phút); refresh token flow xử lý tại User Service.
