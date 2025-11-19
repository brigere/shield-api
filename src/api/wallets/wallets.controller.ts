import { Body, Controller, Get, HttpCode, Post, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { OpenAPI } from 'routing-controllers-openapi';
import { AuthMiddleware } from '../../libs/middlewares/auth.middleware';
import { WalletService } from './wallets.service';
import { AuthenticatedUser, CurrentUser } from '../../libs/decorators/user.decorator';
import { WalletDTO } from './types';

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

  @OpenAPI({
    summary: 'Create a new wallet',
    description: 'Adds a new blockchain wallet address for the authenticated user.',
    tags: ['Wallets'],
    // Define the request body structure for Swagger documentation
    // requestBody: {
    //   content: {
    //     'application/json': {
    //       schema: {
    //         $ref: '#/components/schemas/WalletDTO',
    //       },
    //     },
    //   },
    //   required: true,
    // },
  })
  @Post('/wallets')
  @HttpCode(201) // 201 Created is the standard status code for successful creation
  @UseBefore(AuthMiddleware)
  async create(@Body() walletData: WalletDTO, @CurrentUser() user: AuthenticatedUser) {
    this.loggerService.info(`User ${user.userId} attempting to create new wallet.`);

    const newWallet = await this.walletService.createWallet(user.userId, walletData);

    return newWallet;
  }
}
