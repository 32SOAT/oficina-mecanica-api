import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { UpdateUserInput } from '../dto/user.dto';
import { User } from '../../domain/user';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    const user = existing.update(input);
    return this.userRepository.save(user);
  }
}
