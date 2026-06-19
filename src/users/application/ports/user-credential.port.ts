import { UserCredentialSnapshot } from '../dto/user-credential.dto';

export const USER_CREDENTIAL_PORT = 'USER_CREDENTIAL_PORT';

export abstract class UserCredentialPort {
  abstract findByEmailWithPassword(
    email: string,
  ): Promise<UserCredentialSnapshot | null>;

  abstract findByIdWithPassword(
    id: string,
  ): Promise<UserCredentialSnapshot | null>;

  abstract updatePassword(id: string, passwordHash: string): Promise<void>;
}
