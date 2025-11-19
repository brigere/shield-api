import { PrismaClient } from '@prisma/client';
import Container from 'typedi';
import { JwtService } from '../../src/libs/services/jwt.service';
import { LoggerService } from '../../src/libs/services/logger.service';
import { PasswordService } from '../../src/libs/services/password.service';

export const createTestUser = async (prisma: PrismaClient, email?: string) => {
  const passwordService = Container.get(PasswordService);
  const hashedPassword = await passwordService.hash('Password123!');

  return await prisma.user.create({
    data: {
      email: email || `test-${Date.now()}@example.com`,
      password: hashedPassword,
    },
  });
};

export const generateTestToken = (userId: number, email: string) => {
  const jwtService = Container.get(JwtService);
  return jwtService.generateTokens({ userId, email });
};

export const cleanupTestData = async (prisma: PrismaClient) => {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'test-',
      },
    },
  });
};
