import { Inject, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordInput } from '../dto/auth.dto';
import {
  AUTH_USER_REPOSITORY,
  AuthUserRepository,
} from '../ports/auth-user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../ports/password-hasher.port';

export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.authUserRepository.findByIdWithPassword(
      input.userId,
    );
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const isValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.authUserRepository.updatePassword(input.userId, passwordHash);
  }
}
