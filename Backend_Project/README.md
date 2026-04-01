# Codex Learning Platform - Backend

NestJS backend for Codex Learning Platform

## Installation

```bash
npm install
```

## Environment Setup

Create `.env` file with:

```
DATABASE_URL=postgresql://user:password@localhost:5432/codex
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3000
```

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate -- init

# Open Prisma Studio
npm run prisma:studio
```

## Running the app

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

## API Endpoints

### Authentication (PUBLIC)
- `POST /auth/sign-up` - Register new user
- `POST /auth/sign-in` - Login user
- `GET /auth/me` - Get current user

### Users (@Auth Required)
- `GET /users/:id` - Get user by ID
- `GET /users/:userId/profile` - Get learning profile
- `POST /users/:userId/profile` - Create learning profile
- `PUT /users/:userId/profile` - Update learning profile

### Languages (PUBLIC)
- `GET /languages` - Get all available languages

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── supabase.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── languages/
│       ├── languages.controller.ts
│       ├── languages.service.ts
│       └── languages.module.ts
├── shared/
│   └── database/
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma
```

## Database Schema

### Users Table
- id (UUID, PK)
- email (unique)
- username (unique)
- role (USER, ADMIN)
- supabaseId (unique)
- createdAt
- updatedAt

### Learning Profiles Table
- id (UUID, PK)
- userId (FK)
- proficiencyLevel (beginner, intermediate, advanced)
- learningGoal (get_job, learn_hobby, improve_skills, prepare_interview)
- primaryLanguageId (FK)
- dailyTimeGoal (minutes)
- createdAt
- updatedAt

### Languages Table
- id (UUID, PK)
- name
- slug (unique)
- icon
- description
- createdAt

## Authentication Flow

1. User signs up with email/password via Supabase
2. User record created in database
3. Access token returned to client
4. Client sends token in Authorization header (Bearer scheme)
5. AuthGuard validates token with Supabase
6. Request proceeds if valid

## Validation Rules

### Sign Up
- Email: valid email format
- Password: min 8 chars, contain uppercase, contain number
- Username: min 3 chars, max 20 chars, alphanumeric + underscore/hyphen

### Learning Profile
- Proficiency Level: beginner, intermediate, advanced
- Learning Goal: get_job, learn_hobby, improve_skills, prepare_interview
- Daily Time Goal: 15-480 minutes
