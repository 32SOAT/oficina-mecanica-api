import { HttpException } from '@nestjs/common';
import { UserController } from './user.controller';

type UserService = ConstructorParameters<typeof UserController>[0];
type UserServiceMock = jest.Mocked<
  Pick<UserService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
>;

describe('UserController', () => {
  let controller: UserController;
  let userService: UserServiceMock;
  const user = {
    id: 'user-id',
    username: 'Jane',
    email: 'jane@example.com',
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as UserServiceMock;

    controller = new UserController(userService as UserService);
  });

  it('creates a user', async () => {
    const createUserDto = {
      username: 'Jane',
      email: 'jane@example.com',
    };
    userService.create.mockResolvedValue(user);

    await expect(controller.create(createUserDto)).resolves.toBe(user);
    expect(userService.create).toHaveBeenCalledWith(createUserDto);
  });

  it('lists users with pagination', async () => {
    const paginationDto = {
      page: 2,
      take: 5,
    };
    const result = {
      data: [user],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    userService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(userService.findAll).toHaveBeenCalledWith(paginationDto);
  });

  it('finds one user', async () => {
    userService.findOne.mockResolvedValue(user);

    await expect(controller.findOne(user.id)).resolves.toEqual({
      success: true,
      data: user,
      message: 'User Fetched Successfully',
    });
    expect(userService.findOne).toHaveBeenCalledWith(user.id);
  });

  it('lets findOne service exceptions propagate to Nest', async () => {
    const error = new HttpException('User Not Found', 404);
    userService.findOne.mockRejectedValue(error);

    await expect(controller.findOne('missing-user-id')).rejects.toBe(error);
  });

  it('updates a user', async () => {
    const updateUserDto = {
      username: 'Jane Updated',
    };
    userService.update.mockResolvedValue({
      ...user,
      ...updateUserDto,
    });

    await expect(controller.update(user.id, updateUserDto)).resolves.toEqual({
      success: true,
      message: 'User Updated Successfully',
    });
    expect(userService.update).toHaveBeenCalledWith(user.id, updateUserDto);
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('User Not Found', 404);
    userService.update.mockRejectedValue(error);

    await expect(controller.update('missing-user-id', {})).rejects.toBe(error);
  });

  it('removes a user', async () => {
    userService.remove.mockResolvedValue(user);

    await expect(controller.remove(user.id)).resolves.toEqual({
      success: true,
      message: 'User Deleted Successfully',
    });
    expect(userService.remove).toHaveBeenCalledWith(user.id);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('User Not Found', 404);
    userService.remove.mockRejectedValue(error);

    await expect(controller.remove('missing-user-id')).rejects.toBe(error);
  });
});
