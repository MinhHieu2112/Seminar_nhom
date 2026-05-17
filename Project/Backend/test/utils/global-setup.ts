import { Client } from 'pg';
import { execSync } from 'child_process';
import {
  TEST_DATABASE_URL,
  TEST_SCHEDULER_DATABASE_URL,
  TEST_TEAMWORK_DATABASE_URL,
} from './test-db-setup';

export default async function () {
  console.log('\n🚀 Starting global test database setup...');

  // 1. Create databases if they do not exist
  const client = new Client({
    connectionString: 'postgresql://studyplan:secret@localhost:5432/postgres',
  });

  try {
    await client.connect();
    const dbs = ['db_user_test', 'db_scheduler_test', 'db_teamwork_test'];
    for (const db of dbs) {
      try {
        await client.query(`CREATE DATABASE ${db}`);
        console.log(`✅ Created test database: ${db}`);
      } catch (err: any) {
        if (err.code === '42P04') {
          // Database already exists, safe to ignore
        } else {
          console.warn(
            `⚠️ Warning: Could not create database ${db}:`,
            err.message,
          );
        }
      }
    }
  } catch (err: any) {
    console.error(
      '❌ Failed to connect to default postgres database to verify/create test databases:',
      err.message,
    );
  } finally {
    await client.end();
  }

  // 2. Sync schemas to the isolated test databases (WITHOUT --skip-generate to compile clients correctly)
  console.log('🔄 Syncing Prisma schemas to isolated test databases...');
  try {
    execSync(
      'npx prisma db push --schema=src/users-service/prisma/schema.prisma --accept-data-loss',
      {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      },
    );
    execSync(
      'npx prisma db push --schema=src/scheduler-service/scheduler/prisma/schema.prisma --accept-data-loss',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SCHEDULER_DATABASE_URL: TEST_SCHEDULER_DATABASE_URL,
        },
      },
    );
    execSync(
      'npx prisma db push --schema=src/teamwork-service/prisma/schema.prisma --accept-data-loss',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          TEAMWORK_DATABASE_URL: TEST_TEAMWORK_DATABASE_URL,
        },
      },
    );
    console.log('✅ Isolated test databases are fully synced and ready!\n');
  } catch (error) {
    console.error('❌ Failed to sync Prisma schemas to test databases:', error);
    throw error;
  }
}
