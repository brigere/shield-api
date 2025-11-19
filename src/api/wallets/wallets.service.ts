import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { Wallet } from '@prisma/client';

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
}
