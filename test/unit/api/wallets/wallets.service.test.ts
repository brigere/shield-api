import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WalletService } from '../../../../src/api/wallets/wallets.service';
import { LoggerService } from '../../../../src/libs/services/logger.service';
import { PrismaService } from '../../../../src/config/prisma';
import { NotFoundError } from 'routing-controllers';
import { Wallet } from '@prisma/client';
import { WalletDTO, WalletUpdateDTO } from '../../../../src/api/wallets/types';

describe('WalletService', () => {
  let walletService: WalletService;
  let mockLogger: LoggerService;
  let mockPrismaService: PrismaService;

  const mockWallet: Wallet = {
    id: 1,
    user_id: 100,
    chain: 'ethereum',
    address: '0x1234567890abcdef',
    tag: 'My ETH Wallet',
  };

  const mockWallet2: Wallet = {
    id: 2,
    user_id: 100,
    chain: 'bitcoin',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    tag: 'My BTC Wallet',
  };

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as any;

    // Mock Prisma service with wallet operations
    mockPrismaService = {
      wallet: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as any;

    walletService = new WalletService(mockLogger, mockPrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllByUserId', () => {
    it('should retrieve all wallets for a given user', async () => {
      const userId = 100;
      const mockWallets = [mockWallet, mockWallet2];

      vi.mocked(mockPrismaService.wallet.findMany).mockResolvedValue(mockWallets);

      const result = await walletService.findAllByUserId(userId);

      expect(result).toEqual(mockWallets);
      expect(mockPrismaService.wallet.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(`Fetching all wallets for user ID: ${userId}`);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Found ${mockWallets.length} wallets for user ID: ${userId}`,
      );
    });

    it('should return empty array when user has no wallets', async () => {
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.findMany).mockResolvedValue([]);

      const result = await walletService.findAllByUserId(userId);

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Found 0 wallets for user ID: 100');
    });

    it('should handle different user IDs correctly', async () => {
      const userId1 = 100;
      const userId2 = 200;

      vi.mocked(mockPrismaService.wallet.findMany).mockResolvedValueOnce([mockWallet]);
      vi.mocked(mockPrismaService.wallet.findMany).mockResolvedValueOnce([]);

      const result1 = await walletService.findAllByUserId(userId1);
      const result2 = await walletService.findAllByUserId(userId2);

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(0);
      expect(mockPrismaService.wallet.findMany).toHaveBeenNthCalledWith(1, {
        where: { user_id: userId1 },
      });
      expect(mockPrismaService.wallet.findMany).toHaveBeenNthCalledWith(2, {
        where: { user_id: userId2 },
      });
    });
  });

  describe('createWallet', () => {
    it('should create a new wallet successfully', async () => {
      const userId = 100;
      const walletData: WalletDTO = {
        chain: 'ethereum',
        address: '0x1234567890abcdef',
        tag: 'My ETH Wallet',
      };

      const createdWallet = {
        id: 1,
        tag: walletData.tag,
        chain: walletData.chain,
        address: walletData.address,
      };

      vi.mocked(mockPrismaService.wallet.create).mockResolvedValue(createdWallet as any);

      const result = await walletService.createWallet(userId, walletData);

      expect(result).toEqual(createdWallet);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          ...walletData,
        },
        select: {
          id: true,
          tag: true,
          chain: true,
          address: true,
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Creating wallet for user ID: ${userId} on chain: ${walletData.chain}`,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(`Wallet created successfully: ID ${result.id}`);
    });

    it('should create wallet without tag when tag is not provided', async () => {
      const userId = 100;
      const walletData: WalletDTO = {
        chain: 'bitcoin',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      const createdWallet = {
        id: 2,
        tag: null,
        chain: walletData.chain,
        address: walletData.address,
      };

      vi.mocked(mockPrismaService.wallet.create).mockResolvedValue(createdWallet as any);

      const result = await walletService.createWallet(userId, walletData);

      expect(result).toEqual(createdWallet);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          ...walletData,
        },
        select: {
          id: true,
          tag: true,
          chain: true,
          address: true,
        },
      });
    });

    it('should link wallet to correct user', async () => {
      const userId = 200;
      const walletData: WalletDTO = {
        chain: 'solana',
        address: 'SoLaNA123address',
        tag: 'Solana Wallet',
      };

      const createdWallet = {
        id: 3,
        tag: walletData.tag,
        chain: walletData.chain,
        address: walletData.address,
      };

      vi.mocked(mockPrismaService.wallet.create).mockResolvedValue(createdWallet as any);

      await walletService.createWallet(userId, walletData);

      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: userId,
          }),
        }),
      );
    });
  });

  describe('findOneByIdAndUserId', () => {
    it('should find wallet when it exists and belongs to user', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(mockWallet);

      const result = await walletService.findOneByIdAndUserId(walletId, userId);

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalledWith({
        where: {
          id: walletId,
          user_id: userId,
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Checking wallet ID ${walletId} for ownership by user ID ${userId}.`,
      );
    });

    it('should return null when wallet does not exist', async () => {
      const walletId = 999;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(null);

      const result = await walletService.findOneByIdAndUserId(walletId, userId);

      expect(result).toBeNull();
    });

    it('should return null when wallet exists but belongs to different user', async () => {
      const walletId = 1;
      const wrongUserId = 200;

      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(null);

      const result = await walletService.findOneByIdAndUserId(walletId, wrongUserId);

      expect(result).toBeNull();
      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalledWith({
        where: {
          id: walletId,
          user_id: wrongUserId,
        },
      });
    });

    it('should enforce ownership check in query', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(mockWallet);

      await walletService.findOneByIdAndUserId(walletId, userId);

      const call = vi.mocked(mockPrismaService.wallet.findFirst).mock.calls[0][0];
    });
  });

  describe('updateWallet', () => {
    it('should update wallet successfully when it belongs to user', async () => {
      const walletId = 1;
      const userId = 100;
      const updateData: WalletUpdateDTO = {
        chain: 'ethereum',
        address: '0xnewaddress',
        tag: 'Updated Tag',
      };

      const updatedWallet = { ...mockWallet, ...updateData };

      vi.mocked(mockPrismaService.wallet.update).mockResolvedValue(updatedWallet);

      const result = await walletService.updateWallet(walletId, userId, updateData);

      expect(result).toEqual(updatedWallet);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: {
          id: walletId,
          user_id: userId,
        },
        data: {
          ...updateData,
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Attempting to update wallet ID ${walletId} for user ID ${userId}.`,
      );
    });

    it('should throw NotFoundError when wallet does not exist', async () => {
      const walletId = 999;
      const userId = 100;
      const updateData: WalletUpdateDTO = {
        chain: 'ethereum',
        address: '0xnewaddress',
        tag: 'Updated Tag',
      };

      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      vi.mocked(mockPrismaService.wallet.update).mockRejectedValue(prismaError);

      await expect(walletService.updateWallet(walletId, userId, updateData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(walletService.updateWallet(walletId, userId, updateData)).rejects.toThrow(
        'Wallet not found or access denied.',
      );
    });

    it('should throw NotFoundError when wallet belongs to different user', async () => {
      const walletId = 1;
      const wrongUserId = 200;
      const updateData: WalletUpdateDTO = {
        chain: 'ethereum',
        address: '0xnewaddress',
        tag: 'Updated Tag',
      };

      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      vi.mocked(mockPrismaService.wallet.update).mockRejectedValue(prismaError);

      await expect(walletService.updateWallet(walletId, wrongUserId, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw original error for non-P2025 errors', async () => {
      const walletId = 1;
      const userId = 100;
      const updateData: WalletUpdateDTO = {
        chain: 'ethereum',
        address: '0xnewaddress',
        tag: 'Updated Tag',
      };

      const databaseError = new Error('Database connection failed');

      vi.mocked(mockPrismaService.wallet.update).mockRejectedValue(databaseError);

      await expect(walletService.updateWallet(walletId, userId, updateData)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should enforce ownership in update query', async () => {
      const walletId = 1;
      const userId = 100;
      const updateData: WalletUpdateDTO = {
        chain: 'ethereum',
        address: '0xnewaddress',
        tag: 'Updated Tag',
      };

      vi.mocked(mockPrismaService.wallet.update).mockResolvedValue(mockWallet);

      await walletService.updateWallet(walletId, userId, updateData);

      const call = vi.mocked(mockPrismaService.wallet.update).mock.calls[0][0];
      expect(call.where).toHaveProperty('id', walletId);
      expect(call.where).toHaveProperty('user_id', userId);
    });
  });

  describe('deleteWallet', () => {
    it('should delete wallet successfully when it belongs to user', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.delete).mockResolvedValue(mockWallet);

      await walletService.deleteWallet(walletId, userId);

      expect(mockPrismaService.wallet.delete).toHaveBeenCalledWith({
        where: {
          id: walletId,
          user_id: userId,
        },
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Attempting to permanently delete wallet ID ${walletId} for user ID ${userId}.`,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(`Wallet ID ${walletId} deleted successfully.`);
    });

    it('should enforce ownership in delete query', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.delete).mockResolvedValue(mockWallet);

      await walletService.deleteWallet(walletId, userId);

      const call = vi.mocked(mockPrismaService.wallet.delete).mock.calls[0][0];
      expect(call.where).toHaveProperty('id', walletId);
      expect(call.where).toHaveProperty('user_id', userId);
    });

    it('should throw error when wallet does not exist', async () => {
      const walletId = 999;
      const userId = 100;

      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      vi.mocked(mockPrismaService.wallet.delete).mockRejectedValue(prismaError);

      await expect(walletService.deleteWallet(walletId, userId)).rejects.toThrow(prismaError);
    });

    it('should throw error when wallet belongs to different user', async () => {
      const walletId = 1;
      const wrongUserId = 200;

      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      vi.mocked(mockPrismaService.wallet.delete).mockRejectedValue(prismaError);

      await expect(walletService.deleteWallet(walletId, wrongUserId)).rejects.toThrow(prismaError);
    });

    it('should propagate database errors', async () => {
      const walletId = 1;
      const userId = 100;

      const databaseError = new Error('Database connection failed');

      vi.mocked(mockPrismaService.wallet.delete).mockRejectedValue(databaseError);

      await expect(walletService.deleteWallet(walletId, userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('security and ownership checks', () => {
    it('should always include user_id in findOne where clause', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(mockWallet);

      await walletService.findOneByIdAndUserId(walletId, userId);

      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
          }),
        }),
      );
    });

    it('should always include user_id in update where clause', async () => {
      const walletId = 1;
      const userId = 100;
      const updateData: WalletUpdateDTO = { chain: 'eth', address: '0xabc', tag: 'test' };

      vi.mocked(mockPrismaService.wallet.update).mockResolvedValue(mockWallet);

      await walletService.updateWallet(walletId, userId, updateData);

      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
          }),
        }),
      );
    });

    it('should always include user_id in delete where clause', async () => {
      const walletId = 1;
      const userId = 100;

      vi.mocked(mockPrismaService.wallet.delete).mockResolvedValue(mockWallet);

      await walletService.deleteWallet(walletId, userId);

      expect(mockPrismaService.wallet.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
          }),
        }),
      );
    });
  });

  describe('logging', () => {
    it('should log appropriate messages for all operations', async () => {
      vi.mocked(mockPrismaService.wallet.findMany).mockResolvedValue([mockWallet]);
      vi.mocked(mockPrismaService.wallet.create).mockResolvedValue(mockWallet as any);
      vi.mocked(mockPrismaService.wallet.findFirst).mockResolvedValue(mockWallet);
      vi.mocked(mockPrismaService.wallet.update).mockResolvedValue(mockWallet);
      vi.mocked(mockPrismaService.wallet.delete).mockResolvedValue(mockWallet);

      await walletService.findAllByUserId(100);
      expect(mockLogger.info).toHaveBeenCalled();

      await walletService.createWallet(100, { chain: 'eth', address: '0x123' });
      expect(mockLogger.info).toHaveBeenCalled();

      await walletService.findOneByIdAndUserId(1, 100);
      expect(mockLogger.info).toHaveBeenCalled();

      await walletService.updateWallet(1, 100, { chain: 'eth', address: '0x123', tag: 'test' });
      expect(mockLogger.info).toHaveBeenCalled();

      await walletService.deleteWallet(1, 100);
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
