# 🌟 StudyPlan — Hệ Thống Lập Kế Hoạch Học Tập Thông Minh & Hợp Tác Nhóm

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="StudyPlan Logo" />
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" /></a>
  <a href="https://prisma.io"><img src="https://img.shields.io/badge/Database-Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" /></a>
  <a href="https://redis.io"><img src="https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis" alt="Redis" /></a>
</p>

---

## 📖 1. Giới Thiệu Dự Án

### 🚀 Tổng Quan Hệ Thống
**StudyPlan** là một nền tảng lập kế hoạch học tập thông minh và cộng tác nhóm toàn diện. Dự án được thiết kế dưới dạng kiến trúc **Microservices**, cho phép chia nhỏ các tác vụ xử lý độc lập giúp tăng khả năng chịu tải và mở rộng. 

Nền tảng giúp tối ưu hóa thời gian tự học của cá nhân thông qua mô hình trí tuệ nhân tạo (AI), đồng thời cung cấp không gian tương tác nhóm thời gian thực mượt mà, giúp các nhóm học tập dễ dàng theo dõi tiến độ, trao đổi tài liệu và đánh giá mức độ đóng góp một cách minh bạch.

### 🎯 Mục Tiêu Dự Án
*   **Cá nhân hóa lộ trình**: Sử dụng mô hình AI (Gemini & OpenAI) để tự động lập lịch và phân bổ thời gian học tập tối ưu dựa trên thời gian rảnh và mức độ ưu tiên.
*   **Cộng tác hiệu quả**: Cung cấp bảng Kanban phân công công việc nhóm, quy trình phê duyệt minh chứng hoàn thành từ Leader, và hệ thống chat thời gian thực hỗ trợ sticker/đính kèm.
*   **Trực quan hóa hiệu suất**: Thống kê mức độ đóng góp (Contribution Rate) của từng thành viên bằng các biểu đồ trực quan, giúp tăng tính trách nhiệm khi làm việc nhóm.

### 🛠 Công Nghệ Sử Dụng
*   **Frontend**: 
    *   **Core**: Next.js 15 (App Router), React, TypeScript.
    *   **State Management**: Zustand.
    *   **Data Fetching**: Axios & TanStack React Query (v5) giúp tối ưu hóa cache và đồng bộ dữ liệu.
    *   **Styling & Icons**: Tailwind CSS, Phosphor Icons.
    *   **Charts**: Recharts (vẽ biểu đồ thống kê năng suất).
*   **Backend (Microservices)**:
    *   **Core Framework**: NestJS (v11) với kiến trúc Microservices kết nối qua giao thức **TCP**.
    *   **Database**: PostgreSQL kết hợp **Prisma ORM** quản lý 3 database riêng biệt.
    *   **Caching & Queue**: Redis (quản lý rate limiting, background jobs và cache).
    *   **Real-time Communication**: Socket.io (tương tác chat và thông báo thời gian thực).
    *   **Security & Identity**: JWT (Access Token + Refresh Token), Passport (OAuth2: Google, GitHub, Discord, LinkedIn).
    *   **Third-party API**: Cloudinary (lưu trữ ảnh/avatar), Giphy API (sticker chat).
*   **AI Integration**: Google Gemini API & OpenAI GPT-4o API.
*   **DevOps & Deployment**: Docker, Docker Compose.

---

## 👥 2. Phân Công Thành Viên

Dưới đây là bảng phân công công việc chi tiết dựa trên thỏa thuận phân chia nhiệm vụ của các thành viên trong nhóm:

| Thành viên nhóm | Nội dung công việc | Tỉ lệ phân chia |
| :--- | :--- | :---: |
| **Nguyễn Võ Minh Hiếu** | <ul><li>Thiết kế giao diện frontend hoàn chỉnh cho toàn bộ hệ thống.</li><li>Thiết kế các tính năng bảo mật, đăng nhập, phân quyền tại **User-service**.</li><li>Thiết kế các thuật toán phân bổ, quản lý lịch trình học tập tại **Scheduler-service**.</li><li>Thiết kế hệ thống thu thập và tính toán dữ liệu thống kê tại **Analysis-service**.</li><li>Thiết kế hệ thống gửi thông báo và nhắc lịch tự động tại **Notification-service**.</li><li>Thiết kế tính năng tương tác nhiều người dùng, chia sẻ và kết nối tại **Contact-service**.</li></ul> | **50%** |
| **Trần Đoàn Minh Trí** | <ul><li>Phân tích nghiệp vụ chi tiết của hệ thống và nghiên cứu các phương pháp Vibe Engineering.</li><li>Thiết kế và tối ưu hóa tính năng nhập liệu thông minh bằng ngôn ngữ tự nhiên và hình ảnh tích hợp mô hình **Gemini** và **OpenAI**.</li><li>Thực hiện kiểm thử (Testing) toàn diện hệ thống.</li><li>Tổng hợp báo cáo kỹ thuật, vẽ các sơ đồ kiến trúc và hình minh họa liên quan.</li><li>Xây dựng slide và chuẩn bị tài liệu thuyết trình đồ án.</li></ul> | **50%** |

---

## ⚡ 3. Chức Năng Chính Của Hệ Thống

Hệ thống được chia nhỏ thành các phân hệ chức năng chuyên biệt hoạt động nhịp nhàng thông qua **API Gateway**:

```mermaid
graph TD
    Client[Next.js Frontend] -->|HTTP Request| Gateway[API Gateway: Port 8000]
    Gateway -->|TCP RPC| UserSvc[User-service: Port 8001]
    Gateway -->|TCP RPC| ScheSvc[Scheduler-service: Port 8004]
    Gateway -->|TCP RPC| TeamSvc[Teamwork-service: Port 8007]
    Gateway -->|TCP RPC| AISvc[AI-service: Port 8005]
    
    UserSvc --> DB1[(PostgreSQL: db_user)]
    ScheSvc --> DB2[(PostgreSQL: db_scheduler)]
    TeamSvc --> DB3[(PostgreSQL: db_teamwork)]
```

### 👤 3.1. Phân Hệ Người Dùng & Bảo Mật (User-service)
*   **Xác thực đa phương thức**: Hỗ trợ đăng ký/đăng nhập truyền thống bằng mật khẩu được mã hóa bcrypt, kết hợp đăng nhập nhanh qua Google, GitHub, Discord và LinkedIn.
*   **Cơ chế Token an toàn**: Sử dụng cặp Access Token ngắn hạn và Refresh Token dài hạn lưu trong Cookie bảo mật chống tấn công XSS/CSRF.
*   **Quản lý phiên hoạt động (Active Sessions)**: Người dùng có thể theo dõi danh sách các thiết bị/trình duyệt đang đăng nhập và chủ động đăng xuất từ xa nếu phát hiện bất thường.
*   **Hồ sơ cá nhân**: Cập nhật thông tin chi tiết (Bio, múi giờ, số điện thoại, quốc gia) và tải lên ảnh đại diện qua Cloudinary.

### 📅 3.2. Phân Hệ Lập Lịch Học Tập (Scheduler-service)
*   **Quản lý lịch học cá nhân**: Giao diện Calendar chuyên nghiệp hỗ trợ chế độ xem theo Tuần/Tháng, cho phép kéo thả và tùy chỉnh các khung giờ học tập cố định.
*   **Định nghĩa mục tiêu (Goals & Milestones)**: Thiết lập các mục tiêu lớn và chia nhỏ thành các danh sách việc cần làm (Task checklist).
*   **Lập lịch thông minh bằng AI (Gemini & OpenAI)**: Tự động phân tích các tác vụ đang chờ, thời hạn (Deadline), độ ưu tiên và lịch trình hiện tại của người dùng để sinh ra các block học tập Pomodoro tối ưu mà không bị trùng lịch.

### 👥 3.3. Phân Hệ Hợp Tác Nhóm (Teamwork-service)
*   **Không gian làm việc chung (Workspace)**: Người dùng tự tạo nhóm học tập hoặc tham gia thông qua hệ thống lời mời trực quan.
*   **Bảng phân công công việc (Task Board)**: Trưởng nhóm (Leader) tạo task nhóm, phân công cụ thể cho từng thành viên, đặt deadline và mức độ ưu tiên.
*   **Nộp và phê duyệt minh chứng**: Thành viên sau khi hoàn thành task sẽ tiến hành tải lên minh chứng (Hình ảnh/Tài liệu PDF). Leader sẽ kiểm tra trực tiếp và phê duyệt (Approve) hoặc từ chối (Reject) để yêu cầu làm lại.

### 💬 3.4. Phòng Thảo Luận Thời Gian Thực (Chat Service & Real-time)
*   **Chat Socket.io**: Gửi tin nhắn tức thì, hiển thị trạng thái đang nhập chữ (Typing...), hỗ trợ đính kèm tệp tin tài liệu học tập đa định dạng.
*   **Tiện ích tương tác**: Tích hợp nhãn dán động từ **Giphy Sticker SDK**, hỗ trợ nhắc tên thành viên `@mention` gửi thông báo trực tiếp.
*   **Thảo luận theo ngữ cảnh**: Hỗ trợ tạo luồng chat thảo luận riêng biệt cho từng Task cụ thể để tránh loãng thông tin trong kênh chat chung của nhóm.

### 📊 3.5. Hệ Thống Phân Tích & Thống Kê (Analysis-service)
*   **Thống kê cá nhân**: Vẽ biểu đồ tròn phân tích tỷ lệ trạng thái công việc (Hoàn thành, đang chờ, trễ hạn) và thời gian phân bổ học tập theo các buổi trong ngày.
*   **Thống kê đóng góp nhóm**: Báo cáo trực quan mức độ đóng góp của các thành viên bằng biểu đồ cột ngang so sánh tổng số task được giao và số task thực tế đã hoàn thành xuất sắc.

---

## 📂 4. Cấu Trúc Thư Mục

Dự án được tổ chức rõ ràng theo cấu trúc **Monorepo** chia tách riêng biệt giữa Frontend và Backend ở thư mục gốc:

```text
StudyPlan/
├── Backend/                 # Mã nguồn backend (NestJS Microservices)
│   ├── src/
│   │   ├── api-gateway/     # HTTP gateway tiếp nhận request, xử lý auth & uploads
│   │   ├── users-service/   # Service quản lý tài khoản, profile & bảo mật
│   │   ├── scheduler-service/ # Service quản lý calendar, task, goal & lập lịch
│   │   ├── teamwork-service/  # Service quản lý chat room, group workspace & invitations
│   │   ├── ai-service/      # Service tích hợp và chuẩn hóa prompt cho Gemini/OpenAI
│   │   ├── common/          # Các class helper, exception filter & decorator dùng chung
│   │   └── app.module.ts
│   ├── test/                # Unit tests & integration tests kèm mocks cho Socket.io
│   ├── Dockerfile           # Multi-stage build Dockerfile tối ưu kích thước image
│   ├── docker-compose.yml   # Docker compose chạy dịch vụ PostgreSQL, Redis & App
│   └── package.json
│
├── Frontend/                # Mã nguồn frontend (Next.js App Router)
│   ├── src/
│   │   ├── app/             # Các trang (pages), layouts & routing hệ thống
│   │   ├── components/      # Các component React tái sử dụng (Auth, Teamwork, Scheduler...)
│   │   ├── hooks/           # Custom hooks tích hợp React Query kết nối API
│   │   ├── services/        # Lớp giao tiếp API trực tiếp (Axios services)
│   │   ├── store/           # Global state quản lý bằng Zustand (auth-store, ui-store)
│   │   ├── lib/             # Cấu hình API client, providers & utilities dùng chung
│   │   └── types/           # Định nghĩa TypeScript interfaces đồng bộ với backend
│   └── package.json
│
└── UX:UI/                   # Thư mục lưu trữ hình ảnh minh họa giao diện hệ thống
```

---

## ⚙️ 5. Hướng Dẫn Cài Đặt & Triển Khai

> [!NOTE]
> Khuyến nghị sử dụng hệ điều hành macOS hoặc Linux để có trải nghiệm triển khai mượt mà nhất. Đảm bảo máy tính đã cài đặt **Node.js (>= 22.0.0)**, **pnpm (>= 9.0.0)** và **Docker Desktop**.

### 🛠️ Bước 1: Clone mã nguồn và cài đặt dependencies
Mở Terminal ở thư mục gốc của dự án:
```bash
# Cài đặt dependencies cho Backend
cd Backend
pnpm install

# Quay lại và cài đặt dependencies cho Frontend
cd ../Frontend
pnpm install
```

### 🔑 Bước 2: Thiết lập biến môi trường (Environment Variables)

#### 1. Tạo file `.env` cho Backend:
Chép file cấu hình mẫu tại `Backend/.env.example` thành `Backend/.env` và điền đầy đủ các khóa API:
```env
NODE_ENV=development
GATEWAY_PORT=8000
FRONTEND_URL=http://localhost:3000

# Khóa JWT (Độ dài tối thiểu 32 ký tự)
JWT_SECRET=super_secret_jwt_key_that_is_extremely_long_and_secure_32
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_that_is_extremely_long_and_secure_32

# Chuỗi kết nối Database Local (Nếu sử dụng Docker ở bước 3)
DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_user
SCHEDULER_DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_scheduler
TEAMWORK_DATABASE_URL=postgresql://studyplan:secret@localhost:5432/db_teamwork

# Redis Local Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Khóa API AI (Cần thiết để tính năng AI hoạt động)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# OAuth Credentials (Không bắt buộc nếu chỉ chạy Local cơ bản)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

#### 2. Tạo file `.env.local` cho Frontend:
Tạo file `Frontend/.env.local` từ `Frontend/env.example`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🐳 Bước 3: Khởi động cơ sở dữ liệu và Redis bằng Docker
Chúng tôi cung cấp sẵn cấu hình Docker Compose để khởi động nhanh PostgreSQL và Redis:
```bash
cd Backend

# Khởi động PostgreSQL container và Redis container ở chế độ background
docker-compose up -d postgres-db redis
```

### 🔄 Bước 4: Tạo cấu trúc bảng cơ sở dữ liệu (Database Migrations)
Sử dụng Prisma để tự động sinh cấu trúc bảng trên PostgreSQL:
```bash
cd Backend

# Sinh mã Prisma Client và chạy các tệp migrations
pnpm run prisma:generate
```
> [!TIP]
> Hệ thống Docker Compose đã tích hợp sẵn container `migration-runner` tự động cập nhật Database schema khi bạn chạy toàn bộ app bằng lệnh `docker-compose up -d`.

### 🚀 Bước 5: Chạy ứng dụng

#### 1. Khởi chạy Backend dưới local (Development Mode):
Mở một cửa sổ Terminal mới tại thư mục `Backend`:
```bash
pnpm run start:dev
```
*Hệ thống API Gateway sẽ lắng nghe tại cổng `http://localhost:8000`.*

#### 2. Khởi chạy Frontend:
Mở một cửa sổ Terminal khác tại thư mục `Frontend`:
```bash
pnpm dev
```
*Truy cập ứng dụng của bạn tại đường dẫn: `http://localhost:3000`.*

---

## 🖼️ 6. Giao Diện Hệ Thống

Dưới đây là một số hình ảnh thực tế về giao diện của hệ thống được trích xuất từ thư mục `UX:UI`:

### 🔐 6.1. Đăng Nhập & Bảo Mật Hệ Thống
Hệ thống hỗ trợ đăng ký nhanh gọn, đăng nhập đa dạng thông qua các mạng xã hội phổ biến và quản lý bảo mật nâng cao.

| Đăng nhập / Đăng ký đa nền tảng | Quản lý phiên hoạt động & Đổi mật khẩu |
| :---: | :---: |
| ![Login & Signup](./UX:UI/Login:Signup.png) | ![Profile Security](./UX:UI/Profile_security.png) |

---

### 🏠 6.2. Bảng Điều Khiển Của Người Dùng (Dashboard)
Nơi hiển thị tổng hợp thông tin quan trọng như lịch học hôm nay, tiến độ mục tiêu cá nhân, và danh sách các task nhóm cần phê duyệt.
![Dashboard](./UX:UI/Dashboard.png)

---

### 📅 6.3. Quản Lý Lịch Học & Lập Lịch Học AI (Scheduler)
Giao diện lịch trình trực quan cùng với tính năng gợi ý thông minh từ AI để tự động tối ưu hóa lịch học cá nhân.

| Giao diện lịch học kéo thả trực quan | Sinh lịch tự động thông minh bằng mô hình AI |
| :---: | :---: |
| ![Scheduler](./UX:UI/Scheduler.png) | ![AI Model Integration](./UX:UI/AI_model.png) |

---

### 👥 6.4. Làm Việc Nhóm & Trao Đổi Tài Liệu (Teamwork Workspace)
Hỗ trợ quản lý dự án nhóm, giao việc, nộp bài, thảo luận trực tiếp và tương tác bằng sticker sinh động.

#### 💬 Phòng thảo luận nhóm tích hợp gửi sticker thời gian thực:
![Teamwork Chat](./UX:UI/Teamwork_chat.png)

#### 📝 Phân công công việc nhóm và Theo dõi đóng góp thành viên:
| Phân công nhiệm vụ chi tiết & Theo dõi trạng thái | Thống kê đóng góp (Contribution) của từng thành viên |
| :---: | :---: |
| ![Teamwork Add Task](./UX:UI/Teamwork_add-task.png) | ![Teamwork Analytics](./UX:UI/Teamwork_analytics.png) |

#### ➕ Quản lý thành viên & Gửi lời mời gia nhập nhóm:
![Invite Members](./UX:UI/Teamwork_invite-members.png)

---

### 📊 6.5. Thống Kê & Phân Tích Hiệu Suất Cá Nhân
Vẽ biểu đồ phân tích giúp người dùng đánh giá thời gian phân bổ học tập thực tế và tỷ lệ hoàn thành mục tiêu.
![Personal Analytics](./UX:UI/Analytics.png)

---

### ⚙️ 6.6. Cấu Hình Hệ Thống & Quản Lý Hồ Sơ
Người dùng dễ dàng điều chỉnh hồ sơ cá nhân, bio và tải lên ảnh đại diện chất lượng cao thông qua Cloudinary.

| Chỉnh sửa hồ sơ cá nhân | Trạng thái hiển thị trong Log khởi chạy |
| :---: | :---: |
| ![Profile Bio](./UX:UI/Profile_bio.png) | ![Local Setup](./UX:UI/Local.png) |

---

## 📜 7. Yêu Cầu Trình Bày & Hướng Dẫn Phát Triển

Để đảm bảo chất lượng mã nguồn và tính đồng nhất khi phát triển thêm các tính năng mới cho dự án, các thành viên cần tuân thủ các quy tắc sau:

1.  **Quy tắc đặt tên (Naming Conventions)**:
    *   Sử dụng **camelCase** cho tên biến, tên hàm (Ví dụ: `getMemberProfile`, `createTask`).
    *   Sử dụng **PascalCase** cho tên component React, tên class, interfaces và types (Ví dụ: `StatsTabProps`, `UserService`).
    *   Sử dụng **kebab-case** cho tên thư mục và tên file cấu hình (Ví dụ: `users-service`, `api-client.ts`).
2.  **Đường dẫn tuyệt đối (Absolute Imports)**:
    *   Tại thư mục Frontend, luôn sử dụng ký tự đại diện `@/` để import (Ví dụ: `import { User } from '@/types/api'`), không dùng đường dẫn tương đối dài dòng `../../`.
3.  **Tính đồng bộ dữ liệu (Prisma Schema)**:
    *   Mọi thay đổi cấu trúc bảng cơ sở dữ liệu phải được thực hiện thông qua câu lệnh `prisma migrate dev` để đảm bảo tệp tin migration SQL được tạo ra và lưu vết đồng bộ trong Git repository.
4.  **Kiểm tra chất lượng Code (Linting)**:
    *   Luôn chạy trình kiểm tra lỗi tĩnh trước khi commit code để tránh lỗi runtime:
        *   Backend: `pnpm run lint`
        *   Frontend: `npx eslint src/`
