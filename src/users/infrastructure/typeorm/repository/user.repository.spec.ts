import { Repository } from 'typeorm';
import { UserTypeormRepository } from './user.repository';
import { UserTypeormEntity } from '../entity/user.typeorm.entity';
import { User } from '../../../domain/user';

describe('UserTypeormRepository', () => {
  let repository: UserTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<Repository<UserTypeormEntity>, 'save' | 'findAndCount' | 'findOneBy' | 'remove'>
  >;

  beforeEach(() => {
    ormRepository = {
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };
    repository = new UserTypeormRepository(
      ormRepository as unknown as Repository<UserTypeormEntity>,
    );
  });

  it('saves user', async () => {
    const entity = new UserTypeormEntity();
    entity.id = 'user-id';
    entity.username = 'jane';
    entity.email = 'jane@example.com';
    ormRepository.save.mockResolvedValue(entity);

    const result = await repository.save(
      User.create({ username: 'jane', email: 'jane@example.com' }),
    );

    expect(result.id).toBe('user-id');
    expect(result.username).toBe('jane');
  });

  it('finds all users', async () => {
    const entity = new UserTypeormEntity();
    entity.id = 'user-id';
    entity.username = 'jane';
    entity.email = 'jane@example.com';
    ormRepository.findAndCount.mockResolvedValue([[entity], 1]);

    const [users, count] = await repository.findAll(0, 10);
    expect(users).toHaveLength(1);
    expect(count).toBe(1);
  });

  it('finds by id', async () => {
    ormRepository.findOneBy.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('removes user', async () => {
    const entity = new UserTypeormEntity();
    entity.id = 'user-id';
    entity.username = 'jane';
    entity.email = 'jane@example.com';
    ormRepository.remove.mockResolvedValue(entity);

    const result = await repository.remove(
      User.create({ username: 'jane', email: 'jane@example.com' }),
    );
    expect(result.id).toBe('user-id');
  });
});
