import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';

@Service()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async connect() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async disconnect() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }
}
