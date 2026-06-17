import { AuthenticatedUser } from './authenticated-user';

describe('AuthenticatedUser', () => {
  it('stores authenticated user fields', () => {
    const user = new AuthenticatedUser({
      id: 'user-id',
      username: 'admin',
      email: 'admin@example.com',
    });

    expect(user.id).toBe('user-id');
    expect(user.username).toBe('admin');
    expect(user.email).toBe('admin@example.com');
  });
});
