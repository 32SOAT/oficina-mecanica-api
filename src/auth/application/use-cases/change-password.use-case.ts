import { Injectable, Inject } from '@nestjs/common';
import { UnauthorizedError } from '../../../common/application/errors/application.errors';
import { ChangePasswordInput } from '../dto/auth.dto';
import {
  USER_CREDENTIAL_PORT,
  UserCredentialPort,
} from '../../../users/application/ports/user-credential.port';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../ports/password-hasher.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_CREDENTIAL_PORT)
    private readonly userCredentialPort: UserCredentialPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userCredentialPort.findByIdWithPassword(
      input.userId,
    );
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado.');
    }

    const isValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError('Senha atual incorreta.');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userCredentialPort.updatePassword(input.userId, passwordHash);
  }
}
