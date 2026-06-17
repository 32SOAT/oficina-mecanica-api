import { UserOutputMapper } from './user-output.mapper';

describe('UserOutputMapper', () => {
  it('maps output to domain', () => {
    const user = UserOutputMapper.toDomain(
      { id: 'user-id', username: 'jane', email: 'jane@example.com' },
      'secret',
    );

    expect(user.id).toBe('user-id');
    expect(user.password).toBe('secret');
  });
});
