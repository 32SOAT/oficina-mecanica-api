import { compare, hash, hashSync } from 'bcryptjs';

export const PASSWORD_HASH_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, PASSWORD_HASH_ROUNDS);
}

export function hashPasswordSync(plain: string): string {
  return hashSync(plain, PASSWORD_HASH_ROUNDS);
}

export async function comparePassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plain, passwordHash);
}
