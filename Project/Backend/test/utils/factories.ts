import { randomUUID } from 'crypto';

export function createUserFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    email: `test-${id.slice(0, 8)}@example.com`,
    password: 'password123',
    name: `User ${id.slice(0, 4)}`,
    isActive: true,
    role: 'client',
    ...overrides,
  };
}

export function createCategoryFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    name: `Category ${id.slice(0, 4)}`,
    color: '#3B82F6',
    userId: randomUUID(),
    ...overrides,
  };
}

export function createSubjectFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    name: `Subject ${id.slice(0, 4)}`,
    categoryId: randomUUID(),
    userId: randomUUID(),
    ...overrides,
  };
}

export function createTaskFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    title: `Task ${id.slice(0, 4)}`,
    description: 'Learn Jest testing and NestJS E2E specifications',
    userId: randomUUID(),
    priority: 3,
    status: 'pending',
    submittedForReview: false,
    ...overrides,
  };
}

export function createGroupFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    name: `Study Group ${id.slice(0, 4)}`,
    description: 'Group for Advanced Agentic Coding discussions',
    creatorId: randomUUID(),
    ...overrides,
  };
}

export function createGroupTaskFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    groupId: randomUUID(),
    title: `Group Task ${id.slice(0, 4)}`,
    description: 'Task for group collaboration and leader feedback',
    creatorId: randomUUID(),
    assigneeId: randomUUID(),
    priority: 3,
    status: 'pending',
    submittedForReview: false,
    ...overrides,
  };
}

export function createGroupMessageFactory(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    groupId: randomUUID(),
    senderId: randomUUID(),
    content: `Discussion content ${id.slice(0, 4)}`,
    messageType: 'TEXT',
    ...overrides,
  };
}
