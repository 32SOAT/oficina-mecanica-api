import { NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from '../../application/use-cases/find-all-users.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { RemoveUserUseCase } from '../../application/use-cases/remove-user.use-case';
import { UserPresentationMapper } from '../mappers/user-presentation.mapper';

const output = {
  id: 'user-id',
  username: 'Jane',
  email: 'jane@example.com',
};

describe('UserController', () => {
  let controller: UserController;
  const createUserUseCase = { execute: jest.fn() };
  const findAllUsersUseCase = { execute: jest.fn() };
  const findUserByIdUseCase = { execute: jest.fn() };
  const updateUserUseCase = { execute: jest.fn() };
  const removeUserUseCase = { execute: jest.fn() };

  beforeEach(() => {
    controller = new UserController(
      createUserUseCase as unknown as CreateUserUseCase,
      findAllUsersUseCase as unknown as FindAllUsersUseCase,
      findUserByIdUseCase as unknown as FindUserByIdUseCase,
      updateUserUseCase as unknown as UpdateUserUseCase,
      removeUserUseCase as unknown as RemoveUserUseCase,
    );
  });

  it('creates a user', async () => {
    const createUserDto = {
      username: 'Jane',
      email: 'jane@example.com',
    };
    createUserUseCase.execute.mockResolvedValue(output);

    await expect(controller.create(createUserDto)).resolves.toEqual(output);
    expect(createUserUseCase.execute).toHaveBeenCalledWith(
      UserPresentationMapper.toCreateInput(createUserDto),
    );
  });

  it('lists users with pagination', async () => {
    const paginationDto = { page: 2, take: 5 };
    const result = {
      data: [output],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    findAllUsersUseCase.execute.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toEqual({
      data: [output],
      meta: result.meta,
    });
    expect(findAllUsersUseCase.execute).toHaveBeenCalledWith(
      UserPresentationMapper.toFindAllInput(paginationDto),
    );
  });

  it('finds one user', async () => {
    findUserByIdUseCase.execute.mockResolvedValue(output);

    await expect(controller.findOne(output.id)).resolves.toEqual({
      success: true,
      data: output,
      message: 'Usuário obtido com sucesso.',
    });
    expect(findUserByIdUseCase.execute).toHaveBeenCalledWith(output.id);
  });

  it('lets findOne use case exceptions propagate to Nest', async () => {
    const error = new NotFoundException('Usuário não encontrado.');
    findUserByIdUseCase.execute.mockRejectedValue(error);

    await expect(controller.findOne('missing-user-id')).rejects.toBe(error);
  });

  it('updates a user', async () => {
    const updateUserDto = { username: 'Jane Updated' };
    updateUserUseCase.execute.mockResolvedValue({
      ...output,
      ...updateUserDto,
    });

    await expect(controller.update(output.id, updateUserDto)).resolves.toEqual({
      success: true,
      message: 'Usuário atualizado com sucesso.',
    });
    expect(updateUserUseCase.execute).toHaveBeenCalledWith(
      output.id,
      UserPresentationMapper.toUpdateInput(updateUserDto),
    );
  });

  it('lets update use case exceptions propagate to Nest', async () => {
    const error = new NotFoundException('Usuário não encontrado.');
    updateUserUseCase.execute.mockRejectedValue(error);

    await expect(controller.update('missing-user-id', {})).rejects.toBe(error);
  });

  it('removes a user', async () => {
    removeUserUseCase.execute.mockResolvedValue(output);

    await expect(controller.remove(output.id)).resolves.toEqual({
      success: true,
      message: 'Usuário removido com sucesso.',
    });
    expect(removeUserUseCase.execute).toHaveBeenCalledWith(output.id);
  });

  it('lets remove use case exceptions propagate to Nest', async () => {
    const error = new NotFoundException('Usuário não encontrado.');
    removeUserUseCase.execute.mockRejectedValue(error);

    await expect(controller.remove('missing-user-id')).rejects.toBe(error);
  });
});
