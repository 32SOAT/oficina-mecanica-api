import { AuthUserWithPassword } from '../dto/auth.dto';

export const AUTH_USER_REPOSITORY = 'AUTH_USER_REPOSITORY';

export abstract class AuthUserRepository {
  abstract findByEmailWithPassword(
    email: string,
  ): Promise<AuthUserWithPassword | null>;

  abstract findByIdWithPassword(
    id: string,
  ): Promise<AuthUserWithPassword | null>;

  abstract updatePassword(id: string, passwordHash: string): Promise<void>;
}
