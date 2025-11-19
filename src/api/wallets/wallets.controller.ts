import { Controller, Get, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { OpenAPI } from 'routing-controllers-openapi';
import { AuthMiddleware } from '../../libs/middlewares/auth.middleware';
import { WalletService } from './wallets.service';
import { AuthenticatedUser, CurrentUser } from '../../libs/decorators/user.decorator';

@Service()
@Controller()
export class WalletController {
  constructor(
    private loggerService: LoggerService,
    private db: PrismaService,
    private walletService: WalletService,
  ) {}

  @OpenAPI({
    summary: 'Get all wallets for the authenticated user',
    description: 'Retrieve a list of all blockchain wallets associated with the current user.',
    tags: ['Wallets'],
  })
  @UseBefore(AuthMiddleware)
  @Get('/wallets')
  getAll(@CurrentUser() user: AuthenticatedUser) {
    this.loggerService.info(`Retrieving wallets for user ID: ${user.id}`);
    return this.walletService.findAllByUserId(user.id);
  }
}
