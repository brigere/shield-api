import 'reflect-metadata';
import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  QueryParams,
  HttpError,
  HttpCode,
  UseBefore,
  Req,
} from 'routing-controllers';
import { UserService } from './user.service';
import { Service } from 'typedi';
import { IsInt, IsNumberString, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import { CreateUserDTO } from './dto/create-user-sto';
import { LoggerService } from '../../libs/services/logger.service';
import { AuthMiddleware } from '../../libs/middlewares/auth.middleware';
import { AuthenticatedUser, CurrentUser } from '../../libs/decorators/user.decorator';

class PaginationDTO {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  skip: number;
}

@Service()
@Controller()
export class UserController {
  constructor(
    private userService: UserService,
    private logger: LoggerService,
  ) {}

  @OpenAPI({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users',
    tags: ['Users'],
    parameters: [
      {
        name: 'limit',
        in: 'query',
        description: 'Number of items to return',
        required: false,
        schema: { type: 'integer', default: 10 },
      },
      {
        name: 'skip',
        in: 'query',
        description: 'Number of items to skip',
        required: false,
        schema: { type: 'integer', default: 0 },
      },
    ],
  })
  @UseBefore(AuthMiddleware)
  @Get('/users')
  getAll(@QueryParams() pagination: PaginationDTO, @CurrentUser() user: AuthenticatedUser) {
    this.logger.info('USER', user);
    this.logger.info('retrieving users', pagination);
    return this.userService.findAll();
  }

  @Get('/users/:id')
  getOne(@Param('id') id: number) {
    console.log('get user', id);
    return 'This action returns user #' + id;
  }

  @Post('/users')
  post(@Body() user: CreateUserDTO) {
    return this.userService.createUser(user);
  }

  @Put('/users/:id')
  put(@Param('id') id: number, @Body() user: any) {
    return 'Updating a user...';
  }

  @Delete('/users/:id')
  remove(@Param('id') id: number) {
    return 'Removing user...';
  }
}
