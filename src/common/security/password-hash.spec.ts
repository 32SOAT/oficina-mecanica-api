import {
  comparePassword,
  hashPassword,
  hashPasswordSync,
  PASSWORD_HASH_ROUNDS,
} from './password-hash';

describe('password-hash', () => {
  it('exposes a single bcrypt rounds constant', () => {
    expect(PASSWORD_HASH_ROUNDS).toBe(10);
  });

  it('hashes and compares passwords asynchronously', async () => {
    const passwordHash = await hashPassword('secret123');

    await expect(comparePassword('secret123', passwordHash)).resolves.toBe(
      true,
    );
    await expect(comparePassword('wrong', passwordHash)).resolves.toBe(false);
  });

  it('hashes passwords synchronously with the same rounds', () => {
    const passwordHash = hashPasswordSync('secret123');

    expect(passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
