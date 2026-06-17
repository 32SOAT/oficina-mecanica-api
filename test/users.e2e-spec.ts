import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateUserUseCase } from '../src/users/application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from '../src/users/application/use-cases/find-all-users.use-case';
import { FindUserByIdUseCase } from '../src/users/application/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../src/users/application/use-cases/update-user.use-case';
import { RemoveUserUseCase } from '../src/users/application/use-cases/remove-user.use-case';
import { UserController } from '../src/users/presentation/controllers/user.controller';
import { UserPresentationMapper } from '../src/users/presentation/mappers/user-presentation.mapper';

const expectValidationMessages = (body: unknown, messages: string[]): void => {
  const validationBody = body as { message?: unknown };
  expect(Array.isArray(validationBody.message)).toBe(true);
  expect(validationBody.message).toEqual(expect.arrayContaining(messages));
};

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  const createUserUseCase = { execute: jest.fn() };
  const findAllUsersUseCase = { execute: jest.fn() };
  const findUserByIdUseCase = { execute: jest.fn() };
  const updateUserUseCase = { execute: jest.fn() };
  const removeUserUseCase = { execute: jest.fn() };
  const user = {
    id: 'user-id',
    username: 'Jane',
    email: 'jane@example.com',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: CreateUserUseCase, useValue: createUserUseCase },
        { provide: FindAllUsersUseCase, useValue: findAllUsersUseCase },
        { provide: FindUserByIdUseCase, useValue: findUserByIdUseCase },
        { provide: UpdateUserUseCase, useValue: updateUserUseCase },
        { provide: RemoveUserUseCase, useValue: removeUserUseCase },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /users creates a user and strips unknown properties', async () => {
    const createUserDto = {
      username: 'Jane',
      email: 'jane@example.com',
    };
    createUserUseCase.execute.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        ...createUserDto,
        role: 'admin',
      })
      .expect(201);

    expect(response.body).toEqual(user);
    expect(createUserUseCase.execute).toHaveBeenCalledWith(
      UserPresentationMapper.toCreateInput(createUserDto),
    );
  });

  it('POST /users rejects invalid request bodies', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'not-an-email',
      })
      .expect(400);

    expectValidationMessages(response.body as unknown, [
      'username should not be empty',
      'email must be an email',
    ]);
    expect(createUserUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /users lists users with transformed pagination query params', async () => {
    const result = {
      data: [user],
      meta: {
        itemsPerPage: 1,
        totalItems: 2,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    findAllUsersUseCase.execute.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .get('/users?page=2&take=1')
      .expect(200);

    expect(response.body).toEqual(result);
    expect(findAllUsersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        take: 1,
      }),
    );
  });

  it('GET /users rejects invalid pagination query params', async () => {
    const response = await request(app.getHttpServer())
      .get('/users?page=0&take=10')
      .expect(400);

    expectValidationMessages(response.body as unknown, [
      'Page deve ser positivo.',
    ]);
    expect(findAllUsersUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /users/:id returns a user', async () => {
    findUserByIdUseCase.execute.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: user,
      message: 'Usuário obtido com sucesso.',
    });
    expect(findUserByIdUseCase.execute).toHaveBeenCalledWith(user.id);
  });

  it('GET /users/:id returns 404 when a user is not found', async () => {
    findUserByIdUseCase.execute.mockRejectedValue(
      new NotFoundException('Usuário não encontrado.'),
    );

    const response = await request(app.getHttpServer())
      .get('/users/missing-user-id')
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Usuário não encontrado.',
      }),
    );
  });

  it('PATCH /users/:id updates a user', async () => {
    const updateUserDto = {
      username: 'Jane Updated',
    };
    updateUserUseCase.execute.mockResolvedValue({
      ...user,
      ...updateUserDto,
    });

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id}`)
      .send(updateUserDto)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Usuário atualizado com sucesso.',
    });
    expect(updateUserUseCase.execute).toHaveBeenCalledWith(
      user.id,
      UserPresentationMapper.toUpdateInput(updateUserDto),
    );
  });

  it('PATCH /users/:id rejects invalid request bodies', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id}`)
      .send({
        email: 'not-an-email',
      })
      .expect(400);

    expectValidationMessages(response.body as unknown, [
      'email must be an email',
    ]);
    expect(updateUserUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /users/:id removes a user', async () => {
    removeUserUseCase.execute.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .delete(`/users/${user.id}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Usuário removido com sucesso.',
    });
    expect(removeUserUseCase.execute).toHaveBeenCalledWith(user.id);
  });
});
