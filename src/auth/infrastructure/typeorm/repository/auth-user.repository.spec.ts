import { Repository } from 'typeorm';
import { AuthUserTypeormRepository } from './auth-user.repository';
import { UserEntity } from '../../../../users/infrastructure/typeorm/entity/user.typeorm.entity';

describe('AuthUserTypeormRepository', () => {
  let repository: AuthUserTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<Repository<UserEntity>, 'createQueryBuilder' | 'update'>
  >;

  beforeEach(() => {
    ormRepository = {
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };
    repository = new AuthUserTypeormRepository(
      ormRepository as unknown as Repository<UserEntity>,
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
        Repository<UserEntity>['createQueryBuilder']
      >,
    );

    await expect(
      repository.findByEmailWithPassword('admin@example.com'),
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
        Repository<UserEntity>['createQueryBuilder']
      >,
    );

    await expect(
      repository.findByEmailWithPassword('missing@example.com'),
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
        Repository<UserEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.findByIdWithPassword('user-id')).resolves.toEqual({
      id: 'user-id',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hash',
    });
  });

  it('updates password', async () => {
    ormRepository.update.mockResolvedValue({ affected: 1 } as never);
    await repository.updatePassword('user-id', 'new-hash');
    expect(ormRepository.update).toHaveBeenCalledWith('user-id', {
      password: 'new-hash',
    });
  });
});
