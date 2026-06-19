import { Injectable, Inject } from '@nestjs/common';
import {
  AuthenticatedUserOutput,
  ValidateCredentialsInput,
} from '../dto/auth.dto';
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
  ): Promise<AuthenticatedUserOutput | null> {
    const user = await this.userCredentialPort.findByEmailWithPassword(
      input.email,
    );
    if (!user) {
      return null;
    }

    const isValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
