import { Injectable, Inject } from '@nestjs/common';
import { UnauthorizedError } from '../../../common/application/errors/application.errors';
import { ValidateCredentialsInput } from '../dto/auth.dto';
import { AuthenticatedUserReadModel } from '../read-models/auth-read-model';
import {
  USER_CREDENTIAL_PORT,
  UserCredentialPort,
} from '../../../users/application/ports/user-credential.port';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../ports/password-hasher.port';

@Injectable()
export class ValidateCredentialsUseCase {
  constructor(
    @Inject(USER_CREDENTIAL_PORT)
    private readonly userCredentialPort: UserCredentialPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: ValidateCredentialsInput,
  ): Promise<AuthenticatedUserReadModel> {
    const user = await this.userCredentialPort.findByEmailWithPassword(
      input.email,
    );
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    const isValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
