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
} from 'routing-controllers';
import { UserService } from './user.service';
import { Service } from 'typedi';
import { IsInt, IsNumberString, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
  constructor(private userService: UserService) {}

  // @Get('/users')
  // getAll(@QueryParam('limit') limit: number, @QueryParam('skip') skip: number) {
  //   console.log(`limit: ${limit} | skip: ${skip}`);

  //   return this.userService.findAll();
  // }

  @Get('/users')
  getAll(@QueryParams() pagination: PaginationDTO) {
    console.log(`limit: ${pagination.limit} | skip: ${pagination.skip}`);

    return this.userService.findAll();
  }

  @Get('/users/:id')
  getOne(@Param('id') id: number) {
    throw new HttpError(500, 'This is an error');
    console.log('get user', id);
    return 'This action returns user #' + id;
  }

  @Post('/users')
  post(@Body() user: any) {
    return 'Saving user...';
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
