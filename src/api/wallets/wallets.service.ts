import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { Wallet } from '@prisma/client';
import { WalletDTO } from './types';

@Service()
export class WalletService {
  constructor(
    private logger: LoggerService,
    private db: PrismaService,
  ) {}

  /**
   * Retrieves all wallets belonging to a specific user ID.
   * @param userId The ID of the authenticated user.
   * @returns A promise that resolves to an array of Wallet objects.
   */
  public async findAllByUserId(userId: number): Promise<Wallet[]> {
    this.logger.info(`Fetching all wallets for user ID: ${userId}`);

    // The findMany method returns all records matching the condition.
    // The where clause establishes the foreign key relationship check.

    const wallets = await this.db.wallet.findMany({
      where: {
        user_id: userId,
      },
    });

    this.logger.info(`Found ${wallets.length} wallets for user ID: ${userId}`);
    return wallets;
  }

  /**
   * Creates a new wallet entry linked to a specific user.
   * @param userId The ID of the authenticated user.
   * @param data The validated wallet data (chain, address, tag).
   * @returns A promise that resolves to the newly created Wallet object.
   */
  public async createWallet(userId: number, data: WalletDTO): Promise<Wallet> {
    this.logger.info(`Creating wallet for user ID: ${userId} on chain: ${data.chain}`);

    // Prisma's create method handles inserting the record.
    const newWallet = await this.db.wallet.create({
      data: {
        // Link the wallet to the user via the foreign key
        user_id: userId,

        // Spread the validated data from the DTO
        ...data,
      },
    });

    this.logger.info(`Wallet created successfully: ID ${newWallet.id}`);
    return newWallet;
  }

  /**
   * Retrieves a single wallet by its ID, ensuring it belongs to the specified user.
   * This enforces ownership control.
   * * @param walletId The ID of the wallet to find.
   * @param userId The ID of the authenticated user (owner).
   * @returns A promise that resolves to the Wallet object, or null if not found/unauthorized.
   */
  public async findOneByIdAndUserId(walletId: number, userId: number): Promise<Wallet | null> {
    this.logger.info(`Checking wallet ID ${walletId} for ownership by user ID ${userId}.`);

    const wallet = await this.db.wallet.findFirst({
      where: {
        id: walletId,
        user_id: userId,
      },
    });

    return wallet;
  }
}
