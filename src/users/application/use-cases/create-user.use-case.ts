import { Injectable, Inject } from '@nestjs/common';
import { CreateUserInput } from '../dto/user.dto';
import { User } from '../../domain/user';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = User.create(input);
    return this.userRepository.save(user);
  }
}
