import { BcryptPasswordHasher } from './bcrypt-password.hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hashes and compares password', async () => {
    const hash = await hasher.hash('secret123');
    await expect(hasher.compare('secret123', hash)).resolves.toBe(true);
    await expect(hasher.compare('wrong', hash)).resolves.toBe(false);
  });
});
