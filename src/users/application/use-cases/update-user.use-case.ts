import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateUserInput, UserOutput } from '../dto/user.dto';
import { UserOutputMapper } from '../mappers/user-output.mapper';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<UserOutput> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const user = UserOutputMapper.toDomain(existing).update(input);
    return this.userRepository.save(user);
  }
}
