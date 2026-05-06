import {
  HttpException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserController } from '../src/users/user.controller';
import { UserService } from '../src/users/user.service';

type UserServiceMock = jest.Mocked<
  Pick<UserService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
>;

const expectValidationMessages = (body: unknown, messages: string[]): void => {
  const validationBody = body as { message?: unknown };
  expect(Array.isArray(validationBody.message)).toBe(true);
  expect(validationBody.message).toEqual(expect.arrayContaining(messages));
};

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserServiceMock;
  const user = {
    id: 'user-id',
    username: 'Jane',
    email: 'jane@example.com',
  };

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /users creates a user and strips unknown properties', async () => {
    const createUserDto = {
      username: 'Jane',
      email: 'jane@example.com',
    };
    userService.create.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        ...createUserDto,
        role: 'admin',
      })
      .expect(201);

    expect(response.body).toEqual(user);
    expect(userService.create).toHaveBeenCalledWith(createUserDto);
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
    expect(userService.create).not.toHaveBeenCalled();
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
    userService.findAll.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .get('/users?page=2&take=1')
      .expect(200);

    expect(response.body).toEqual(result);
    expect(userService.findAll).toHaveBeenCalledWith(
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
    expect(userService.findAll).not.toHaveBeenCalled();
  });

  it('GET /users/:id returns a user', async () => {
    userService.findOne.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: user,
      message: 'Usuário obtido com sucesso.',
    });
    expect(userService.findOne).toHaveBeenCalledWith(user.id);
  });

  it('GET /users/:id returns 404 when a user is not found', async () => {
    userService.findOne.mockRejectedValue(
      new HttpException('Usuário não encontrado.', 404),
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
    userService.update.mockResolvedValue({
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
    expect(userService.update).toHaveBeenCalledWith(user.id, updateUserDto);
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
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('DELETE /users/:id removes a user', async () => {
    userService.remove.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .delete(`/users/${user.id}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Usuário removido com sucesso.',
    });
    expect(userService.remove).toHaveBeenCalledWith(user.id);
  });
});
