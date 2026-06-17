import { Inject, NotFoundException } from '@nestjs/common';
import { UserOutput } from '../dto/user.dto';
import { USER_REPOSITORY, UserRepository } from '../ports/user.repository';

export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<UserOutput> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }
}
