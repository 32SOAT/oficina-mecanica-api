import { NotFoundError } from '../../../common/application/errors/application.errors';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllUsersUseCase } from './find-all-users.use-case';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';

describe('FindAllUsersUseCase', () => {
  let useCase: FindAllUsersUseCase;
  const userRepository = {
    findAll: jest.fn(),
  };

  beforeEach(() => {
    useCase = new FindAllUsersUseCase(userRepository as never);
    jest.clearAllMocks();
  });

  it('uses page 1 when pagination page is omitted', async () => {
    const users = [{ id: 'user-id', username: 'Jane', email: 'jane@example.com' }];
    userRepository.findAll.mockResolvedValue([users, 25]);

    const result = await useCase.execute({});

    expect(userRepository.findAll).toHaveBeenCalledWith(0, DEFAULT_PAGE_SIZE);
    expect(result.meta).toEqual({
      itemsPerPage: DEFAULT_PAGE_SIZE,
      totalItems: 25,
      currentPage: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('uses the requested page and take when listing users', async () => {
    const users = [{ id: 'user-id', username: 'Jane', email: 'jane@example.com' }];
    userRepository.findAll.mockResolvedValue([users, 25]);

    const result = await useCase.execute({ page: 3, take: 5 });

    expect(userRepository.findAll).toHaveBeenCalledWith(10, 5);
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
});

describe('FindUserByIdUseCase', () => {
  const userRepository = { findById: jest.fn() };

  it('throws NotFoundError when a user is not found', async () => {
    const useCase = new FindUserByIdUseCase(userRepository as never);
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-user-id')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
