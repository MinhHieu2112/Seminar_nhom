import { execSync } from 'child_process';

// Override environment variables for test databases
export const TEST_DATABASE_URL =
  'postgresql://studyplan:secret@localhost:5432/db_user_test';
export const TEST_SCHEDULER_DATABASE_URL =
  'postgresql://studyplan:secret@localhost:5432/db_scheduler_test';
export const TEST_TEAMWORK_DATABASE_URL =
  'postgresql://studyplan:secret@localhost:5432/db_teamwork_test';

export function setupTestEnvironment() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.SCHEDULER_DATABASE_URL = TEST_SCHEDULER_DATABASE_URL;
  process.env.TEAMWORK_DATABASE_URL = TEST_TEAMWORK_DATABASE_URL;
}

// Automatically sync schema to test databases
export function syncTestSchemas() {
  setupTestEnvironment();
  console.log('🔄 Syncing Prisma schemas to isolated test databases...');

  try {
    execSync(
      'npx prisma db push --schema=src/users-service/prisma/schema.prisma --accept-data-loss --skip-generate',
      {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      },
    );
    execSync(
      'npx prisma db push --schema=src/scheduler-service/scheduler/prisma/schema.prisma --accept-data-loss --skip-generate',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SCHEDULER_DATABASE_URL: TEST_SCHEDULER_DATABASE_URL,
        },
      },
    );
    execSync(
      'npx prisma db push --schema=src/teamwork-service/prisma/schema.prisma --accept-data-loss --skip-generate',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          TEAMWORK_DATABASE_URL: TEST_TEAMWORK_DATABASE_URL,
        },
      },
    );
    console.log('✅ Test databases synced successfully!');
  } catch (error) {
    console.error('❌ Error syncing test database schemas:', error);
    throw error;
  }
}

// Reusable table truncator for database isolation between test cases
export async function clearDatabase(prisma: any) {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames as any[]) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
        );
      } catch {
        // Ignore errors if table doesn't exist
      }
    }
  }
}
