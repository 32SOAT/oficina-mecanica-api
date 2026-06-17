export const PASSWORD_HASHER = 'PASSWORD_HASHER';

export abstract class PasswordHasher {
  abstract compare(plain: string, hash: string): Promise<boolean>;
  abstract hash(plain: string): Promise<string>;
}
