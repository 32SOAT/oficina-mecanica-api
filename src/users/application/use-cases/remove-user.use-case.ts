import { Inject, NotFoundException } from '@nestjs/common';
import { UserOutput } from '../dto/user.dto';
import { UserOutputMapper } from '../mappers/user-output.mapper';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

export class RemoveUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<UserOutput> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.userRepository.remove(UserOutputMapper.toDomain(existing));
  }
}
