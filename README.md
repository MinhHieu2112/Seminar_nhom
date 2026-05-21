# 🎓 StudyPlan - Hệ thống Lập kế hoạch Học tập & Cộng tác Thông minh

Chào mừng bạn đến với **StudyPlan**! Đây là tài liệu hướng dẫn onboard chi tiết dành cho các thành viên mới bắt đầu phát triển dự án. Tài liệu này sẽ giúp bạn hiểu rõ kiến trúc, cài đặt môi trường và vận hành dự án từ con số 0.

---

## 📌 1. Giới thiệu dự án & Tính năng chính

**StudyPlan** là một nền tảng quản lý học tập cá nhân và học nhóm (teamwork) trực quan, kết hợp công nghệ Trí tuệ Nhân tạo (AI) giúp tối ưu hóa tiến trình và lộ trình học tập của học sinh, sinh viên. Dự án được triển khai trên kiến trúc **Microservices** hiện đại nhằm đảm bảo tính độc lập, dễ mở rộng và hiệu năng cao.

### 🌟 Các tính năng chính:
*   **Quản lý Kế hoạch & Mục tiêu (Scheduler)**: Thiết lập mục tiêu học tập (Goals), phân loại danh mục học tập (Categories) và quản lý danh sách công việc hàng ngày trực quan.
*   **Cộng tác Học nhóm (Teamwork & Chat)**: Tạo nhóm học tập, mời thành viên, phân công công việc nhóm (Group Tasks), trò chuyện trực tuyến thời gian thực (Real-time Chat via WebSockets) tích hợp gửi Sticker/GIF thông qua **Giphy API**.
*   **Trợ lý Học tập AI (AI Planner)**: Đề xuất lộ trình học và tự động tạo kế hoạch công việc thông minh dựa trên mục tiêu đầu ra mong muốn của người dùng (tích hợp **Google Gemini & OpenAI**).
*   **Phân tích hiệu suất học tập (Analytics)**: Biểu đồ trực quan hóa thời gian và tiến độ học tập (KPIs, Time Breakdown) hỗ trợ bộ lọc khoảng thời gian tùy chọn.
*   **Hệ thống Quản lý Người dùng & Bảo mật**: Đăng ký, đăng nhập bảo mật (mật khẩu mã hóa `bcrypt`), hỗ trợ đăng nhập xã hội (Google, GitHub, Discord, LinkedIn OAuth), quản lý trang cá nhân với ảnh đại diện upload trực tiếp lên **Cloudinary**.
*   **Trang Quản trị & Giám sát hệ thống (Admin & Health Check)**: Quản lý tập trung tài khoản người dùng và theo dõi trạng thái sống sót (Health status) của từng microservice.

---

## 🛠️ 2. Công nghệ sử dụng

Hệ thống được phát triển bằng phương pháp chia tách Microservices độc lập giao tiếp qua giao thức TCP hiệu năng cao:

### 📱 Frontend (Next.js App Router)
*   **Core**: Next.js 16 (App Router), React 19, TypeScript
*   **Quản lý State**: Zustand (Global Store)
*   **Truy vấn dữ liệu**: Axios, React Query (TanStack Query)
*   **Giao diện & Hiệu ứng**: Tailwind CSS 4, Phosphor Icons, Framer Motion
*   **Biểu đồ**: Recharts
*   **Kết nối thời gian thực**: Socket.io-client

### ⚙️ Backend (Microservices NestJS)
*   **Core**: NestJS 11, TypeScript, `@nestjs/microservices`
*   **API Gateway**: Cổng trung chuyển điều hướng HTTP, xử lý xác thực tập trung (JWT Access/Refresh), phân tải Rate Limit và WebSocket Server (Socket.io).
*   **Dịch vụ độc lập (Microservices)**:
    1.  **Users Service**: Quản lý thông tin cá nhân, hồ sơ và xác thực.
    2.  **Scheduler Service**: Quản lý mục tiêu cá nhân, lập lịch biểu học tập.
    3.  **Teamwork Service**: Quản lý nhóm, thảo luận nhóm, chat thời gian thực và đồng bộ dữ liệu người dùng.
    4.  **AI Service**: Tích hợp các AI provider (Gemini, OpenAI).

### 🗄️ Database, Caching & Infrastructure
*   **Cơ sở dữ liệu**: PostgreSQL 15 (Chạy 3 database độc lập: `db_user`, `db_scheduler`, `db_teamwork`).
*   **ORM**: Prisma 6 (Sử dụng các client sinh độc lập cho từng service) & TypeORM.
*   **Caching & Queue**: Redis 7, BullMQ (Quản lý hàng đợi xử lý nền và bộ lọc giới hạn Rate limit).
*   **Lưu trữ đám mây**: Cloudinary API (Lưu trữ hình ảnh).
*   **AI Services**: Google Gemini API (`@google/genai`), OpenAI API.
*   **Containerization**: Docker, Docker Compose (Cấu hình build đa tầng tối ưu dung lượng).

---

## 📐 3. Sơ đồ kiến trúc hệ thống

Dưới đây là mô hình luồng hoạt động của hệ thống StudyPlan:

```mermaid
graph TD
    Client[Next.js Frontend: Port 3000] -->|HTTP / WebSockets| Gateway[API Gateway: Port 8000]
    
    subgraph Backend Microservices [NestJS Backend Services]
        Gateway -->|TCP Port 8001| UsersService[Users Service: Port 8011 / 8001]
        Gateway -->|TCP Port 8004| SchedulerService[Scheduler Service: Port 8003 / 8004]
        Gateway -->|TCP Port 8007| TeamworkService[Teamwork Service: Port 8006 / 8007]
        Gateway -->|TCP Port 8005| AIService[AI Service: Port 8005]
        
        SchedulerService <-->|TCP / HTTP| TeamworkService
        SchedulerService <-->|HTTP| UsersService
        TeamworkService <-->|HTTP| UsersService
    end

    subgraph Data & Cache [Infrastructure Layer]
        UsersService -->|Prisma| Postgres[(PostgreSQL: Port 5432 <br/> db_user, db_scheduler, db_teamwork)]
        SchedulerService -->|Prisma| Postgres
        TeamworkService -->|Prisma| Postgres
        
        Gateway -->|ioredis| Redis[(Redis: Port 6379 <br/> Cache, Rate Limit, BullMQ)]
        UsersService -->|ioredis| Redis
        SchedulerService -->|ioredis| Redis
        TeamworkService -->|ioredis| Redis
    end
    
    subgraph External [External Services]
        Gateway -.->|OAuth| Google[Google, GitHub, Discord, LinkedIn]
        Gateway -.->|Media Upload| Cloudinary[Cloudinary API]
        TeamworkService -.->|GIFs| Giphy[Giphy API]
        AIService -.->|GenAI| LLM[Google Gemini & OpenAI]
    end

    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef gateway fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef microservice fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef infra fill:#eceff1,stroke:#455a64,stroke-width:2px;
    classDef ext fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    
    class Client client;
    class Gateway gateway;
    class UsersService,SchedulerService,TeamworkService,AIService microservice;
    class Postgres,Redis infra;
    class Google,Cloudinary,Giphy,LLM ext;
```

---

## 📋 4. Yêu cầu môi trường cài đặt

Trước khi bắt đầu cài đặt, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
*   **Node.js**: Phiên bản `>= 22.0.0`
*   **Package Manager**: **pnpm** `>= 9.0.0` (Vui lòng không dùng `npm` hay `yarn` để tránh xung đột file lock).
*   **Docker & Docker Compose**: Đã cài đặt và đang chạy ngầm trên máy.
*   **Hệ điều hành**: macOS, Windows (WSL2), hoặc Linux.

---

## 🚀 5. Hướng dẫn khởi chạy dự án nhanh chóng

### Bước 1: Clone dự án
Mở terminal và chạy lệnh:
```bash
git clone https://github.com/MinhHieu2112/Seminar_nhom.git
cd Seminar_nhom
```

### Bước 2: Cài đặt dependencies toàn bộ dự án
Vì dự án tách biệt rõ ràng giữa Backend và Frontend, chúng ta sẽ cài đặt thư viện cho từng phần:
```bash
# 1. Cài đặt thư viện cho Backend
cd Project/Backend
pnpm install

# 2. Cài đặt thư viện cho Frontend
cd ../Frontend
pnpm install
```

---

## 🔑 6. Cấu hình biến môi trường (`.env`)

Bạn cần cấu hình các file biến môi trường để dự án có thể chạy trơn tru:

### 🔹 6.1. Cấu hình Backend (`Project/Backend/.env`)
Tại thư mục `Project/Backend`, copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Mở file `.env` mới tạo và cấu hình các giá trị cần thiết:
*   **Database connection**: Cấu hình các chuỗi kết nối PostgreSQL (nếu chạy Docker, có thể giữ nguyên mặc định):
    ```env
    DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_user
    SCHEDULER_DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_scheduler
    TEAMWORK_DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_teamwork
    ```
*   **AI API Keys (Không bắt buộc để khởi động, nhưng cần để dùng tính năng AI)**:
    ```env
    GEMINI_API_KEY=your_actual_gemini_api_key
    OPENAI_API_KEY=your_actual_openai_api_key
    ```
*   **JWT Security & Secrets (Đảm bảo tối thiểu 32 ký tự)**:
    ```env
    JWT_SECRET=nhap_key_xac_thuc_jwt_tai_day_32_ky_tu
    JWT_REFRESH_SECRET=nhap_key_refresh_jwt_tai_day_32_ky_tu
    ```
*   **Cloudinary (Cấu hình tải ảnh đại diện)**:
    ```env
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

### 🔹 6.2. Cấu hình Frontend (`Project/Frontend/.env.local`)
Tại thư mục `Project/Frontend`, copy file `env.example` thành `.env.local`:
```bash
cp env.example .env.local
```
Cấu hình các biến chính:
```env
# API Gateway URL kết nối trực tiếp đến backend (cần giữ hậu tố /api/v1)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# URL của Client Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudinary CDN Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## 🏃‍♂️ 7. Cách khởi chạy dự án

### 🐳 Cách 1: Sử dụng Docker Compose (Khuyên dùng - Nhanh nhất)
Docker Compose sẽ khởi tạo tất cả các hạ tầng PostgreSQL, Redis, tự khởi tạo 3 cơ sở dữ liệu độc lập, chạy migration tự động qua `migration-runner`, và build/khởi chạy toàn bộ 5 dịch vụ Backend song song.

1.  Hãy chắc chắn Docker Desktop của bạn đang chạy.
2.  Mở terminal tại thư mục `Project/Backend/` và chạy:
    ```bash
    docker-compose up --build
    ```
3.  Khi terminal backend đã chạy ổn định và in ra dòng: `API Gateway listening on http://0.0.0.0:8000`, mở terminal mới tại thư mục `Project/Frontend/` và khởi động UI:
    ```bash
    pnpm dev
    ```
4.  Truy cập ứng dụng tại: `http://localhost:3000`

---

### 💻 Cách 2: Khởi chạy thủ công bằng Local (Phục vụ phát triển & Debug)
Cách này giúp bạn có thể chỉnh sửa code và debug nóng trực tiếp trên từng dịch vụ backend cục bộ.

#### 1. Khởi động PostgreSQL và Redis trên Docker (chỉ chạy cơ sở hạ tầng)
Tại thư mục `Project/Backend/`, khởi chạy nhanh cơ sở dữ liệu và cache:
```bash
docker-compose up -d postgres-db redis
```

> [!NOTE]
> PostgreSQL khi khởi động bằng Docker sẽ tự động chạy file `init-db/init.sql` để tạo sẵn 3 database trống: `db_user`, `db_scheduler`, và `db_teamwork`.

#### 2. Đồng bộ Prisma Client & Chạy migrations
Chúng ta cần sinh Prisma Client và đẩy cấu trúc bảng vào cơ sở dữ liệu cho từng service:
```bash
# Tạo các client Prisma cục bộ cho cả 3 microservices
pnpm run prisma:generate

# Chạy migrations để khởi tạo bảng dữ liệu
npx prisma migrate dev --schema=src/users-service/prisma/schema.prisma --name init
npx prisma migrate dev --schema=src/scheduler-service/scheduler/prisma/schema.prisma --name init
npx prisma migrate dev --schema=src/teamwork-service/prisma/schema.prisma --name init
```

#### 3. Chạy các dịch vụ Backend song song
Mở các terminal riêng biệt tại thư mục `Project/Backend/` để khởi động từng service:

*   **API Gateway (Cổng điều hành - Bắt buộc)**:
    ```bash
    pnpm run start:dev
    ```
*   **Users Service (Bắt buộc)**:
    ```bash
    npx ts-node src/main.microservice.ts
    ```
*   **Scheduler Service (Bắt buộc)**:
    ```bash
    npx ts-node src/main.scheduler.ts
    ```
*   **Teamwork Service (Học nhóm & Chat)**:
    ```bash
    npx ts-node src/main.teamwork.ts
    ```
*   **AI Service (Trợ lý AI - Không bắt buộc)**:
    ```bash
    pnpm run start:ai
    ```

#### 4. Khởi chạy Frontend Next.js
Mở terminal tại thư mục `Project/Frontend/` và chạy:
```bash
pnpm dev
```

---

## 👥 8. Tài khoản dùng thử mẫu (Sample Accounts)

Bạn hoàn toàn có thể đăng ký tài khoản mới trực tiếp từ giao diện trang Đăng ký. Tuy nhiên để kiểm thử nhanh chóng, bạn có thể đăng nhập bằng các tài khoản có sẵn dưới đây:

| Vai trò | Email đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@studyplan.app` | `Admin@123456` |
| **Người dùng mẫu (User)** | `user@studyplan.app` | `User@123456` |

---

## 📂 9. Cấu trúc thư mục chính của dự án

Cấu trúc cây thư mục mô phỏng của toàn bộ workspace:

```text
Seminar_nhom/
├── Bai_hoc/                  # Tài liệu, Slide bài học, chuyên đề lý thuyết
└── Project/                  # Thư mục mã nguồn chính của ứng dụng
    ├── Backend/              # --- PROJECT BACKEND (NestJS Microservices) ---
    │   ├── init-db/          # SQL Script khởi tạo db lúc Docker start
    │   ├── src/              
    │   │   ├── api-gateway/  # API Gateway: CORS, Auth, Sockets, Uploads
    │   │   ├── users-service/# Quản lý User Profile & Security
    │   │   ├── scheduler-service/ # Quản lý Goals, Task, Categories
    │   │   ├── teamwork-service/  # Quản lý Groups, Group Tasks, Live Chat
    │   │   ├── ai-service/   # Cầu nối gọi Google Gemini & OpenAI APIs
    │   │   └── common/       # Pipes, Filters, Guards dùng chung
    │   ├── Dockerfile        # Dockerfile build đa tầng (Multi-stage target build)
    │   ├── docker-compose.yml# Định nghĩa hệ sinh thái dbs, redis & microservices
    │   └── package.json      
    └── Frontend/             # --- PROJECT FRONTEND (Next.js App Router) ---
        ├── src/
        │   ├── app/          # Next.js App Router (pages: /scheduler, /analytics...)
        │   ├── components/   # UI & Component tái sử dụng (teamwork, layouts)
        │   ├── hooks/        # React Custom hooks kết nối API & Zustand
        │   ├── store/        # Zustand global state (auth-store, ui-store)
        │   ├── services/     # Lớp API Services tập trung (axios client)
        │   └── lib/          # Khởi tạo api-client & Providers
        └── package.json
```

---

## ⚠️ 10. Các lỗi thường gặp và cách xử lý (Troubleshooting)

### 🚨 Lỗi 1: Trùng hoặc bận cổng kết nối (Port already in use)
*   **Nguyên nhân**: Cổng mặc định của PostgreSQL (`5432`), Redis (`6379`) hoặc API Gateway (`8000`) bị chiếm dụng bởi phần mềm khác đang chạy trên máy của bạn.
*   **Cách xử lý**: Mở file `.env` ở `Project/Backend/`, cấu hình lại các cổng kết nối bên ngoài thông qua các biến cấu hình `EXTERNAL_*` (ví dụ: đổi `EXTERNAL_POSTGRES_PORT=5433` và sửa cổng kết nối cơ sở dữ liệu tương ứng).

### 🚨 Lỗi 2: Thiếu Prisma Client hoặc báo lỗi Type
*   **Nguyên nhân**: Khi vừa pull code mới từ GitHub, các client Prisma cục bộ chưa được sinh tương thích với máy của bạn.
*   **Cách xử lý**: Chạy lệnh sinh client tại thư mục `Project/Backend`:
    ```bash
    pnpm run prisma:generate
    ```

### 🚨 Lỗi 3: Chưa migrate dữ liệu hoặc lỗi "Relation does not exist"
*   **Nguyên nhân**: Cơ sở dữ liệu trống chưa được đồng bộ cấu trúc bảng từ các schema Prisma.
*   **Cách xử lý**: Hãy chắc chắn Docker PostgreSQL đang chạy, sau đó chạy lần lượt 3 lệnh migrate để khởi tạo cấu trúc bảng:
    ```bash
    npx prisma migrate dev --schema=src/users-service/prisma/schema.prisma --name init
    npx prisma migrate dev --schema=src/scheduler-service/scheduler/prisma/schema.prisma --name init
    npx prisma migrate dev --schema=src/teamwork-service/prisma/schema.prisma --name init
    ```

### 🚨 Lỗi 4: Gặp lỗi CORS khi Frontend gọi API Backend
*   **Nguyên nhân**: API Gateway chưa cấu hình đúng URL của Frontend được phép truy xuất.
*   **Cách xử lý**: Kiểm tra biến `FRONTEND_URL` trong file `.env` ở Backend, đảm bảo giá trị của nó khớp hoàn toàn với địa chỉ cổng chạy của Frontend Next.js (mặc định là `http://localhost:3000`).

### 🚨 Lỗi 5: Đăng nhập được nhưng một số tính năng (như Scheduler) báo lỗi Gateway 500
*   **Nguyên nhân**: API Gateway không thể kết nối tới các microservice nội bộ qua cổng TCP.
*   **Cách xử lý**: Đảm bảo tất cả các microservices (`users-service`, `scheduler-service`, `teamwork-service`) đều đã được khởi chạy thành công trên local hoặc Docker Compose.

---

## 🔗 11. Tài liệu & Liên kết API Endpoint

Khi hệ thống khởi chạy hoàn tất:
*   **Cổng API Gateway chính thức**: `http://localhost:8000/api/v1`
*   **Các Endpoint tiêu biểu**:
    *   Xác thực: `/api/v1/auth/login` | `/api/v1/auth/register` | `/api/v1/auth/refresh`
    *   Hồ sơ cá nhân: `/api/v1/users/me` (GET, PATCH)
    *   Lịch trình học tập: `/api/v1/scheduler/goals` | `/api/v1/scheduler/tasks`
    *   Nhóm học tập (Teamwork): `/api/v1/teamwork/groups`

---
Chúc bạn có một trải nghiệm onboarding tuyệt vời và có nhiều đóng góp xuất sắc cho sự phát triển của **StudyPlan**! Nếu gặp bất kỳ khó khăn nào ngoài các lỗi trên, hãy liên hệ trực tiếp với nhóm trưởng hoặc đăng một Issue mới lên Repository. 🚀
