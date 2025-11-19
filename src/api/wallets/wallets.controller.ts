import {
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
  Put,
  UseBefore,
} from 'routing-controllers';
import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { OpenAPI } from 'routing-controllers-openapi';
import { AuthMiddleware } from '../../libs/middlewares/auth.middleware';
import { WalletService } from './wallets.service';
import { AuthenticatedUser, CurrentUser } from '../../libs/decorators/user.decorator';
import { CreatedWallet, WalletDTO, WalletUpdateDTO } from './types';
import { APIResponse } from '../../libs/helpers/api-helpers';
import { Wallet } from '@prisma/client';

@Service()
@JsonController('/wallets')
export class WalletController {
  constructor(
    private loggerService: LoggerService,
    private walletService: WalletService,
  ) {}

  @OpenAPI({
    summary: 'Get all wallets for the authenticated user',
    description: 'Retrieve a list of all blockchain wallets associated with the current user.',
    tags: ['Wallets'],
  })
  @UseBefore(AuthMiddleware)
  @Get()
  async getAll(@CurrentUser() user: AuthenticatedUser): Promise<APIResponse<Wallet[]>> {
    this.loggerService.info(`Retrieving wallets for user ID: ${user.userId}`);
    try {
      const wallets = await this.walletService.findAllByUserId(user.userId);
      return {
        status: 'success',
        data: wallets,
      };
    } catch (e) {
      this.loggerService.error('Failed to fetch wallets', e);
      throw new Error('Somthing wrong happened');
    }
  }

  @OpenAPI({
    summary: 'Create a new wallet',
    description: 'Adds a new blockchain wallet address for the authenticated user.',
    tags: ['Wallets'],
  })
  @Post()
  @HttpCode(201) // 201 Created is the standard status code for successful creation
  @UseBefore(AuthMiddleware)
  async create(
    @Body() walletData: WalletDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<APIResponse<CreatedWallet>> {
    this.loggerService.info(`User ${user.userId} attempting to create new wallet.`);

    const newWallet = await this.walletService.createWallet(user.userId, walletData);
    return {
      status: 'success',
      data: newWallet,
    };
  }

  @OpenAPI({
    summary: 'Get a single wallet by ID',
    description: 'Retrieves a specific wallet belonging to the authenticated user.',
    tags: ['Wallets'],
  })
  @UseBefore(AuthMiddleware)
  @Get('/:id') // Note the dynamic segment ':id'
  async getOne(
    @Param('id') id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<APIResponse<Wallet>> {
    this.loggerService.info(`User ${user.userId} attempting to retrieve wallet ID: ${id}`);

    // Call service to find the wallet, passing both IDs for ownership check
    const wallet = await this.walletService.findOneByIdAndUserId(id, user.userId);

    if (!wallet) {
      this.loggerService.warn(
        `Wallet ID ${id} not found or unauthorized access attempt by user ${user.userId}.`,
      );
      throw new NotFoundError('Wallet not found or access denied.');
    }

    return {
      status: 'success',
      data: wallet,
    };
  }

  @OpenAPI({
    summary: 'Update an existing wallet',
    description:
      'Updates the details (tag, chain, address) of a specific wallet belonging to the authenticated user.',
    tags: ['Wallets'],
  })
  @Put('/:id')
  @UseBefore(AuthMiddleware)
  async update(
    @Param('id') id: number,
    @Body() updateData: WalletUpdateDTO, // Use the new update DTO
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<APIResponse<Wallet>> {
    this.loggerService.info(`User ${user.userId} attempting to update wallet ID: ${id}.`);

    try {
      // Pass the wallet ID, user ID, and update data to the service
      const updatedWallet = await this.walletService.updateWallet(id, user.userId, updateData);

      return {
        status: 'success',
        data: updatedWallet,
      };
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        throw e;
      }
      throw new Error(`Failed to update wallet: ${e.message}`);
    }
  }

  @OpenAPI({
    summary: 'Delete a wallet by ID',
    description: 'Deletes a specific wallet belonging to the authenticated user.',
    tags: ['Wallets'],
  })
  @Delete('/:id')
  @UseBefore(AuthMiddleware)
  async remove(
    @Param('id') id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<APIResponse<null>> {
    this.loggerService.info(`User ${user.userId} attempting to delete wallet ID: ${id}.`);

    try {
      await this.walletService.deleteWallet(id, user.userId);
      return { status: 'success', message: 'Wallet deleted successfully (No Content).' };
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        throw e;
      }
      throw new Error(`Failed to delete wallet: ${e.message}`);
    }
  }
}
