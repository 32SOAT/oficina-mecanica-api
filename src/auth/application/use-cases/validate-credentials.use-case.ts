import { Inject } from '@nestjs/common';
import {
  AuthenticatedUserOutput,
  ValidateCredentialsInput,
} from '../dto/auth.dto';
import {
  AUTH_USER_REPOSITORY,
  AuthUserRepository,
} from '../ports/auth-user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../ports/password-hasher.port';

export class ValidateCredentialsUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: ValidateCredentialsInput,
  ): Promise<AuthenticatedUserOutput | null> {
    const user = await this.authUserRepository.findByEmailWithPassword(
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
