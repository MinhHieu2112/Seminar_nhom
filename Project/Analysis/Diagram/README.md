# UML Diagrams - Hệ thống Quản lý Lịch học AI

## Tổng quan
Thư mục này chứa toàn bộ sơ đồ UML được sinh từ việc phân tích toàn bộ
codebase Frontend (Next.js 14) và Backend (NestJS Microservices).

---

## Danh sách file UML

| # | File | Loại sơ đồ | Mô tả |
|---|------|-----------|-------|
| 01 | `01_class_diagram_entities.puml` | **Class Diagram** | Tất cả Entity classes của Backend (User, Goal, Task, ScheduleBlock, CalendarEvent, WorkingHoursConfig) và quan hệ giữa chúng |
| 02 | `02_component_diagram_architecture.puml` | **Component Diagram** | Toàn bộ kiến trúc Microservices: Frontend → API Gateway → 7 Microservices → Databases |
| 03 | `03_sequence_auth_flow.puml` | **Sequence Diagram** | Luồng xác thực: Register, Login, Refresh, Forgot/Reset Password, Logout |
| 04 | `04_sequence_schedule_generation.puml` | **Sequence Diagram** | Luồng sinh lịch học AI: Tạo Goal → AI Decompose → Generate Schedule → Sync Calendar |
| 05 | `05_usecase_diagram.puml` | **Use Case Diagram** | Tất cả chức năng của 4 actor: Client, Admin, AI Agent, System |
| 06 | `06_frontend_component_diagram.puml` | **Component Diagram** | Cấu trúc Frontend: Pages, Components, Lib, Hooks, Types |
| 07 | `07_state_diagram_lifecycle.puml` | **State Diagram** | Vòng đời của Task, ScheduleBlock, Goal, CalendarEvent |
| 08 | `08_deployment_diagram.puml` | **Deployment Diagram** | Cơ sở hạ tầng Docker Compose: containers, ports, networks, databases |
| 09 | `09_sequence_analytics_flow.puml` | **Sequence Diagram** | Luồng Analytics: Dashboard, Study Insights, History |

---

## Kiến trúc hệ thống tóm tắt

### Backend (NestJS Microservices)
```
API Gateway (HTTP :3000)
├── AuthGatewayController     → POST /api/v1/auth/*
├── UsersGatewayController    → GET/PATCH /api/v1/users/*
├── AdminGatewayController    → GET/POST /api/v1/admin/*
├── SchedulerGatewayController→ /api/v1/scheduler/*
├── CalendarGatewayController → /api/v1/calendar/*
├── AiGatewayController       → POST /api/v1/ai/*
└── AnalyticsGatewayController→ GET /api/v1/analytics/*

Microservices (TCP Communication):
├── user-service      (TCP :3001) → PostgreSQL users_db + Redis
├── scheduler-service (TCP :3002) → PostgreSQL scheduler_db
├── calendar-service  (TCP :3003) → PostgreSQL calendar_db
├── analytics-service (TCP :3004) → READ scheduler_db (shared)
├── ai-service        (TCP :3005) → Stateless (no DB)
├── notification-service (TCP :3006) → Redis Bull Queue
└── queue-service     (TCP :3007) → In-memory store
```

### Frontend (Next.js 14 App Router)
```
src/
├── app/
│   ├── (public): /login, /register, /forgot-password, /reset-password
│   └── (dashboard): /dashboard, /scheduler, /profile, /admin
├── components/
│   ├── auth/      LoginForm, RegisterForm
│   ├── layout/    Header, Sidebar
│   ├── scheduler/ GoalList, TaskList, ScheduleView, GenerateScheduleModal
│   ├── analytics/ AnalyticsDashboard, Charts
│   ├── admin/     UsersTable
│   └── profile/   ProfileForm
├── lib/
│   ├── api.ts         (authApi, goalApi, taskApi, scheduleApi, calendarApi, analyticsApi, aiApi)
│   ├── api-client.ts  (Axios + interceptors)
│   ├── auth-store.ts  (Zustand)
│   └── schemas.ts     (Zod validation)
└── types/
    └── api.ts         (User, Goal, Task, ScheduleBlock, CalendarEvent, ...)
```

### Entities & Relationships
```
User (1) ──────── (n) Goal
                       │
Goal (1) ──────── (n) Task
                       │
Task (1) ──────── (n) ScheduleBlock

User (1) ──────── (n) CalendarEvent
User (1) ──────── (7) WorkingHoursConfig
```

---

## Cách render UML

### Option 1: VS Code Extension
Cài extension **PlantUML** từ marketplace, mở file `.puml` và nhấn `Alt+D`.

### Option 2: Online
1. Vào https://www.plantuml.com/plantuml/uml/
2. Paste nội dung file `.puml` vào

### Option 3: CLI (Java)
```bash
java -jar plantuml.jar *.puml
```

### Option 4: NPM
```bash
npm install -g node-plantuml
npx puml generate *.puml --format png
```

---

## Phân tích

### Điểm mạnh kiến trúc
- **Microservices decoupled**: 7 services giao tiếp qua TCP MessagePattern
- **Single Gateway**: Tất cả HTTP traffic đi qua 1 điểm
- **JWT Stateless Auth**: Token verify tại Gateway, không cần gọi đến User Service
- **AI Pipeline 2 pha**: Normalize (AI Service) → Schedule (Scheduler Service)
- **Pomodoro Algorithm**: Lên lịch theo kỹ thuật quản lý thời gian Pomodoro

### Luồng dữ liệu chính
```
Frontend → API Gateway (HTTP) → Microservice (TCP) → Database
                ↑                        ↓
           JWT Verify              MessagePattern
```

### Giao tiếp nội bộ
- Frontend ↔ API Gateway: **HTTP REST (JSON)**
- API Gateway ↔ Microservices: **TCP (NestJS MessagePattern)**
- Notification: **Bull Queue (Redis)**
- Token/OTP: **Redis (ioredis)**
