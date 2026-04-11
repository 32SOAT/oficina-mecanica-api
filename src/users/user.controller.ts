import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginationDto } from 'src/querying/dtos/pagination.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected error';
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.userService.findOne(id);
      return {
        success: true,
        data,
        message: 'User Fetched Successfully',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      await this.userService.update(id, updateUserDto);
      return {
        success: true,
        message: 'User Updated Successfully',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.userService.remove(id);
      return {
        success: true,
        message: 'User Deleted Successfully',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }
}
