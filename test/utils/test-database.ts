import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TestDatabase {
  private prisma: PrismaClient;
  private databaseUrl: string;

  constructor() {
    // Use a test database
    this.databaseUrl =
      process.env.DATABASE_URL_TEST ||
      'postgresql://postgres:postgres@localhost:5432/shield_test?schema=public';

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });
  }

  async setup() {
    // Run migrations
    process.env.DATABASE_URL = this.databaseUrl;
    await execAsync('npx prisma migrate deploy');
    await this.prisma.$connect();
  }

  async cleanup() {
    // Clean all tables
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }

  async teardown() {
    await this.prisma.$disconnect();
  }

  getClient() {
    return this.prisma;
  }
}
