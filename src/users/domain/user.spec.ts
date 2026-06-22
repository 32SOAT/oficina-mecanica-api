import { User } from './user';

describe('User', () => {
  it('creates user', () => {
    const user = User.create({
      username: 'jane',
      email: 'jane@example.com',
      password: 'secret',
    });

    expect(user.username).toBe('jane');
    expect(user.email).toBe('jane@example.com');
    expect(user.password).toBe('secret');
  });

  it('updates partial fields preserving password', () => {
    const user = new User({
      id: 'user-id',
      username: 'jane',
      email: 'jane@example.com',
      password: 'secret',
    });

    const updated = user.update({ email: 'new@example.com' });

    expect(updated.email).toBe('new@example.com');
    expect(updated.username).toBe('jane');
    expect(updated.password).toBe('secret');
  });

  it('updates username preserving demais campos', () => {
    const user = new User({
      id: 'user-id',
      username: 'jane',
      email: 'jane@example.com',
    });

    const updated = user.update({ username: 'janet' });

    expect(updated.username).toBe('janet');
    expect(updated.email).toBe('jane@example.com');
  });
});
