# Refactor Scheduler-Service for Team Collaboration

This plan outlines the steps to extend the `scheduler-service` with group collaboration features.

## User Review Required

> [!IMPORTANT]
> This refactor introduces new tables to the database. A Prisma migration will be required to apply these changes.

## Proposed Changes

### Database Layer (Prisma)

#### [MODIFY] [schema.prisma](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/prisma/schema.prisma)
- Add `Group` model to store team information.
- Add `GroupMember` model to manage user-group associations and roles.
- Update `Schedule` model to include an optional `groupId` field and relation.

### Backend Infrastructure

#### [NEW] [group.dto.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/dto/group.dto.ts)
- `CreateGroupDto`: name, description.
- `AddMemberDto`: userId, role.

#### [NEW] [group.guard.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/guards/group.guard.ts)
- Implement a Guard that extracts `groupId` from request parameters or body.
- Verify that the authenticated user (from headers or context) is a member of the group.
- Throw `ForbiddenException` if access is denied.

#### [NEW] [groups.service.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/groups.service.ts)
- `createGroup(userId: string, dto: CreateGroupDto)`
- `addMember(userId: string, groupId: string, dto: AddMemberDto)`
- `getGroups(userId: string)`
- `getGroupMembers(groupId: string)`

#### [NEW] [groups.controller.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/groups.controller.ts)
- Endpoints for group management (POST `/groups`, GET `/groups`, POST `/groups/:id/members`).

### Scheduler Refactoring

#### [MODIFY] [scheduler.dto.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/dto/scheduler.dto.ts)
- Add `groupId` to `CreateScheduleDto`.

#### [MODIFY] [scheduler.service.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/scheduler.service.ts)
- Update `createSchedule` to accept `groupId`.
- Update `getSchedules` to return both personal and group schedules.

#### [MODIFY] [scheduler.controller.ts](file:///Users/nguyenvominhhieu/Downloads/Seminar_nhom/Project/Backend/src/scheduler-service/scheduler/scheduler.controller.ts)
- Apply `GroupGuard` to endpoints where `groupId` is provided.

## Verification Plan

### Automated Tests
- I will attempt to run `npx prisma generate` to ensure the schema is valid.
- I will check the NestJS compilation by simulating a build (if possible).

### Manual Verification
- Verify that a user can create a group.
- Verify that a user can create a schedule for a group.
- Verify that a user NOT in the group cannot access the group's schedules.
