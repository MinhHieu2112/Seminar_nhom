# Optimized Unified Dockerfile for Backend Microservices
# Stage 1: Base image with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9
WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm pkg delete scripts.postinstall
RUN pnpm install --frozen-lockfile

# Stage 3: Builder (generates Prisma clients and builds NestJS)
FROM dependencies AS builder
COPY . .
# Generate all Prisma clients into dedicated node_modules/@prisma/ subfolders
RUN pnpm prisma generate --schema=src/users-service/prisma/schema.prisma
RUN pnpm prisma generate --schema=src/scheduler-service/scheduler/prisma/schema.prisma
RUN pnpm prisma generate --schema=src/teamwork-service/prisma/schema.prisma
# Build the entire monorepo/source
RUN pnpm run build

# Stage 4: Production Dependencies
FROM base AS prod-dependencies
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml ./
RUN npm pkg delete scripts.postinstall
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# CRITICAL: Copy the generated Prisma clients from the builder stage
# Since we used custom output paths in schema.prisma, these are real directories
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Stage 5: Runner Template (Common environment for all services)
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl tzdata netcat-openbsd
ENV TZ=Asia/Ho_Chi_Minh
WORKDIR /app
COPY --from=prod-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy Prisma CLI binary (devDependency - not in prod install) and engines
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Copy complete Prisma folders (including migrations and schemas) so they are available at runtime
COPY --from=builder /app/src/users-service/prisma ./src/users-service/prisma
COPY --from=builder /app/src/scheduler-service/scheduler/prisma ./src/scheduler-service/scheduler/prisma
COPY --from=builder /app/src/teamwork-service/prisma ./src/teamwork-service/prisma

# --- Service-specific Stages ---

# API Gateway Stage
FROM runner AS api-gateway
EXPOSE 8000
CMD ["node", "dist/src/main.js"]

# User Service Stage
FROM runner AS user-service
EXPOSE 8001
CMD ["node", "dist/src/main.microservice.js"]

# Scheduler Service Stage
FROM runner AS scheduler-service
EXPOSE 8003
CMD ["node", "dist/src/main.scheduler.js"]

# Teamwork Service Stage
FROM runner AS teamwork-service
EXPOSE 8006
CMD ["node", "dist/src/main.teamwork.js"]

# AI Service Stage
FROM runner AS ai-service
EXPOSE 8005
CMD ["node", "dist/src/main.ai.js"]
