# Implementation Plan - Rebuilding scheduler-service (Detailed)

## Database Schema (Prisma)

I've designed the following schema based on the requirements:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id        String    @id @default(uuid())
  name      String
  color     String?
  userId    String
  subjects  Subject[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([name, userId])
}

model Subject {
  id         String     @id @default(uuid())
  name       String
  categoryId String
  category   Category   @relation(fields: [categoryId], references: [id])
  userId     String
  schedules  Schedule[]
  tasks      Task[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@unique([name, userId, categoryId])
}

model Schedule {
  id        String   @id @default(uuid())
  userId    String
  startTime DateTime
  endTime   DateTime
  dayOfWeek Int      // 0-6
  subjectId String?
  subject   Subject? @relation(fields: [subjectId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id              String           @id @default(uuid())
  userId          String
  title           String
  description     String?
  dueTime         DateTime?
  subjectId       String?
  subject         Subject?         @relation(fields: [subjectId], references: [id])
  priority        Int              @default(3)
  status          String           @default("pending")
  allocations     TaskAllocation[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model TaskAllocation {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  startTime DateTime
  endTime   DateTime
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model UserPreference {
  id        String   @id @default(uuid())
  userId    String   @unique
  settings  Json     // Storage for theme, work hours, etc.
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Service Communication

The `scheduler-service` will communicate with `user-service` via HTTP:
- Endpoint: `http://user-service-app:8001/api/v1/users/internal/:id` (Hypothetical, needs to be implemented or verified in `user-service`).

## Docker Setup

I will update [docker-compose.yml](file:///Users/nguyenvominhhieu/Downloads/Seminar/Project/Backend/docker-compose.yml) to:
1. Initialize `scheduler_db` on startup.
2. Update the `DATABASE_URL` for `scheduler-service`.

```yaml
  postgres:
    # ... existing ...
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
```

## Migration Path

1. Create `init-db/init.sql` to create the additional database.
2. Initialize Prisma in the `scheduler-service`.
3. Generate the first migration.
4. Implement the CRUD logic in NestJS.
