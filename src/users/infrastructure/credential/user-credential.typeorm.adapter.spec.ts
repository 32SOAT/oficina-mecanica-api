import { Repository } from 'typeorm';
import { UserCredentialTypeormAdapter } from './user-credential.typeorm.adapter';
import { UserTypeormEntity } from '../typeorm/entity/user.typeorm.entity';

describe('UserCredentialTypeormAdapter', () => {
  let adapter: UserCredentialTypeormAdapter;
  let ormRepository: jest.Mocked<
    Pick<Repository<UserTypeormEntity>, 'createQueryBuilder' | 'update'>
  >;

  beforeEach(() => {
    ormRepository = {
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };
    adapter = new UserCredentialTypeormAdapter(
      ormRepository as unknown as Repository<UserTypeormEntity>,
    );
  });

  it('finds user by email with password', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'user-id',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hash',
      }),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<UserTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(
      adapter.findByEmailWithPassword('admin@example.com'),
    ).resolves.toEqual({
      id: 'user-id',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hash',
    });
  });

  it('returns null when user not found by email', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<UserTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(
      adapter.findByEmailWithPassword('missing@example.com'),
    ).resolves.toBeNull();
  });

  it('finds user by id with password', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'user-id',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hash',
      }),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<UserTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(adapter.findByIdWithPassword('user-id')).resolves.toEqual({
      id: 'user-id',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hash',
    });
  });

  it('returns null when user not found by id', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<UserTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(adapter.findByIdWithPassword('missing')).resolves.toBeNull();
  });

  it('updates password', async () => {
    ormRepository.update.mockResolvedValue({ affected: 1 } as never);
    await adapter.updatePassword('user-id', 'new-hash');
    expect(ormRepository.update).toHaveBeenCalledWith('user-id', {
      password: 'new-hash',
    });
  });
});
