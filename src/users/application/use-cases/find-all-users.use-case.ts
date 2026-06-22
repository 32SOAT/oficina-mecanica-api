import { Injectable, Inject } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { PaginationMeta } from '../../../common/pagination/pagination';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllUsersInput } from '../dto/user.dto';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: FindAllUsersInput) {
    const page = input.page ?? 1;
    const take = input.take ?? DEFAULT_PAGE_SIZE;
    const offset = calculateOffset(take, page);
    const [data, count] = await this.userRepository.findAll(offset, take);
    const meta = createPaginationMeta(take, page, count);
    return { data, meta };
  }
}

export type FindAllUsersResult = {
  data: Awaited<ReturnType<UserRepository['findAll']>>[0];
  meta: PaginationMeta | undefined;
};
