import { PaginationDto } from '../../../common/pagination/pagination.dto';
import {
  CreateUserInput,
  FindAllUsersInput,
  UpdateUserInput,
} from '../../application/dto/user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export class UserPresentationMapper {
  static toCreateInput(dto: CreateUserDto): CreateUserInput {
    return {
      username: dto.username,
      email: dto.email,
    };
  }

  static toUpdateInput(dto: UpdateUserDto): UpdateUserInput {
    return {
      username: dto.username,
      email: dto.email,
    };
  }

  static toFindAllInput(dto: PaginationDto): FindAllUsersInput {
    return {
      page: dto.page,
      take: dto.take,
    };
  }
}
