import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  setupTestEnvironment,
  clearDatabase,
} from '../../../../test/utils/test-db-setup';
import { createUserFactory } from '../../../../test/utils/factories';

describe('UserService (Integration)', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    setupTestEnvironment();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        {
          provide: 'REDIS_CLIENT',
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and retrieves a user profile in the database', async () => {
    const userSeed = createUserFactory({ email: 'integrate@test.com' });

    // Direct db insert via Prisma Service
    const dbUser = await prisma.user.create({
      data: {
        id: userSeed.id,
        email: userSeed.email,
        name: userSeed.name,
      },
    });

    // Retrieve via UserService
    const profile = await service.getProfile(dbUser.id);
    expect(profile.email).toBe('integrate@test.com');
  });

  it('updates a user profile and persists properties', async () => {
    const userSeed = createUserFactory();
    await prisma.user.create({
      data: {
        id: userSeed.id,
        email: userSeed.email,
      },
    });

    await service.updateProfile(userSeed.id, {
      country: 'Vietnam',
      city: 'Ho Chi Minh',
      firstName: 'Minh Hieu',
    });

    const updated = await prisma.user.findUnique({
      where: { id: userSeed.id },
    });
    expect(updated?.country).toBe('Vietnam');
    expect(updated?.firstName).toBe('Minh Hieu');
  });
});
