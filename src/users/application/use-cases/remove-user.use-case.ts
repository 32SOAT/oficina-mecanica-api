import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { User } from '../../domain/user';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

@Injectable()
export class RemoveUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    return this.userRepository.remove(existing);
  }
}
