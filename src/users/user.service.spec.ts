import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

type UserRepositoryMock = jest.Mocked<
  Pick<
    Repository<UserEntity>,
    'create' | 'save' | 'findAndCount' | 'findOneBy' | 'merge' | 'remove'
  >
>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepositoryMock;

  const user = (overrides: Partial<UserEntity> = {}): UserEntity => ({
    id: 'user-id',
    username: 'Jane',
    email: 'jane@example.com',
    ...overrides,
  });

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    } as UserRepositoryMock;

    service = new UserService(
      userRepository as Repository<UserEntity>,
      new PaginationService(),
    );
  });

  it('creates a user', async () => {
    const createUserDto = {
      username: 'Jane',
      email: 'jane@example.com',
    };
    const createdUser = user(createUserDto);
    userRepository.create.mockReturnValue(createdUser);
    userRepository.save.mockResolvedValue(createdUser);

    await expect(service.create(createUserDto)).resolves.toBe(createdUser);
    expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
    expect(userRepository.save).toHaveBeenCalledWith(createdUser);
  });

  it('uses page 1 when pagination page is omitted', async () => {
    const users = [user()];
    userRepository.findAndCount.mockResolvedValue([users, 25]);

    const result = await service.findAll({});

    expect(userRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: DefaultPageSize.USER,
    });
    expect(result.meta).toEqual({
      itemsPerPage: DefaultPageSize.USER,
      totalItems: 25,
      currentPage: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('uses the requested page and take when listing users', async () => {
    const users = [user()];
    userRepository.findAndCount.mockResolvedValue([users, 25]);

    const result = await service.findAll({ page: 3, take: 5 });

    expect(userRepository.findAndCount).toHaveBeenCalledWith({
      skip: 10,
      take: 5,
    });
    expect(result).toEqual({
      data: users,
      meta: {
        itemsPerPage: 5,
        totalItems: 25,
        currentPage: 3,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
  });

  it('finds one user by id', async () => {
    const existingUser = user();
    userRepository.findOneBy.mockResolvedValue(existingUser);

    await expect(service.findOne(existingUser.id)).resolves.toBe(existingUser);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({
      id: existingUser.id,
    });
  });

  it('throws 404 when a user is not found', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    try {
      await service.findOne('missing-user-id');
      throw new Error('Expected findOne to throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
      expect((error as HttpException).message).toBe('User Not Found');
    }
  });

  it('updates a user', async () => {
    const existingUser = user();
    const updateUserDto: UpdateUserDto = {
      username: 'Jane Updated',
    };
    const updatedUser = user(updateUserDto);
    userRepository.findOneBy.mockResolvedValue(existingUser);
    userRepository.merge.mockReturnValue(updatedUser);
    userRepository.save.mockResolvedValue(updatedUser);

    await expect(service.update(existingUser.id, updateUserDto)).resolves.toBe(
      updatedUser,
    );
    expect(userRepository.findOneBy).toHaveBeenCalledWith({
      id: existingUser.id,
    });
    expect(userRepository.merge).toHaveBeenCalledWith(
      existingUser,
      updateUserDto,
    );
    expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
  });

  it('removes a user', async () => {
    const existingUser = user();
    userRepository.findOneBy.mockResolvedValue(existingUser);
    userRepository.remove.mockResolvedValue(existingUser);

    await expect(service.remove(existingUser.id)).resolves.toBe(existingUser);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({
      id: existingUser.id,
    });
    expect(userRepository.remove).toHaveBeenCalledWith(existingUser);
  });
});
