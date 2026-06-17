import { Inject } from '@nestjs/common';
import { CreateUserInput } from '../dto/user.dto';
import { UserOutput } from '../dto/user.dto';
import { User } from '../../domain/user';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const user = User.create(input);
    return this.userRepository.save(user);
  }
}
