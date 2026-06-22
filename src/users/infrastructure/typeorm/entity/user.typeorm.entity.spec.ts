import { User } from '../../../domain/user';
import { UserTypeormEntity } from './user.typeorm.entity';

describe('UserTypeormEntity', () => {
  it('fromDomain define id e password quando informados', () => {
    const entity = UserTypeormEntity.fromDomain(
      User.create({
        id: 'user-id',
        username: 'jane',
        email: 'jane@example.com',
        password: 'hash',
      }),
    );

    expect(entity.id).toBe('user-id');
    expect(entity.password).toBe('hash');
  });

  it('toDomain não expõe password', () => {
    const entity = new UserTypeormEntity();
    entity.id = 'user-id';
    entity.username = 'jane';
    entity.email = 'jane@example.com';
    entity.password = 'hash';

    const domain = entity.toDomain();

    expect(domain.password).toBeUndefined();
    expect(domain.username).toBe('jane');
  });
});
