import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EstoqueController } from '../src/estoque/estoque.controller';
import { EstoqueService } from '../src/estoque/estoque.service';
import { EstoqueEntity } from '../src/estoque/estoque.entity';
import {
  E2E_AUTH_USER_STUB,
  FakeJwtAuthGuard,
} from './helpers/fake-jwt-auth.guard';

describe('Estoque (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    executarOperacao: jest.fn(),
    remove: jest.fn(),
    registrarReposicaoEstoque: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [EstoqueController],
      providers: [
        { provide: EstoqueService, useValue: serviceMock },
        Reflector,
        { provide: APP_GUARD, useClass: FakeJwtAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const itemSample = (overrides: Partial<EstoqueEntity> = {}): EstoqueEntity =>
    Object.assign(new EstoqueEntity(), {
      id: 1,
      codigo: 'PCA-E2E-001',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 10,
      quantidadeReservada: 0,
      precoUnitario: 45.5,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    });

  it('POST /estoque responde 201 quando o service cria o item', async () => {
    const criado = itemSample();
    serviceMock.create.mockResolvedValueOnce(criado);

    const body = {
      codigo: 'PCA-E2E-001',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 10,
      precoUnitario: 45.5,
    };

    const res = await request(app.getHttpServer())
      .post('/estoque')
      .send(body)
      .expect(201);

    expect(res.body).toMatchObject({
      id: 1,
      codigo: body.codigo,
      pecasInsumos: body.pecasInsumos,
      quantidadeFisica: body.quantidadeFisica,
      precoUnitario: expect.any(Number),
    });
    expect(serviceMock.create).toHaveBeenCalledWith(body);
  });

  it('POST /estoque responde 400 quando o body falha na validação', async () => {
    await request(app.getHttpServer())
      .post('/estoque')
      .send({
        codigo: '',
        pecasInsumos: 'x',
        quantidadeFisica: -1,
        precoUnitario: 0,
      })
      .expect(400);

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('GET /estoque lista paginada (estoque_baixo=false por padrão)', async () => {
    serviceMock.findAll.mockResolvedValueOnce({
      data: [],
      meta: { itemsPerPage: 10, totalItems: 0, currentPage: 1 },
    });

    const res = await request(app.getHttpServer())
      .get('/estoque?page=1&take=10')
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, take: 10 }),
      false,
    );
  });

  it('GET /estoque com estoque_baixo=true repassa filtro ao service', async () => {
    serviceMock.findAll.mockResolvedValueOnce({ data: [], meta: {} });

    await request(app.getHttpServer())
      .get('/estoque?page=1&take=5&estoque_baixo=true')
      .expect(200);

    expect(serviceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, take: 5 }),
      true,
    );
  });

  it('GET /estoque/:id retorna o item quando existe', async () => {
    serviceMock.findOne.mockResolvedValueOnce(
      itemSample({ id: 42, codigo: 'PCA-42' }),
    );

    const res = await request(app.getHttpServer())
      .get('/estoque/42')
      .expect(200);

    expect(res.body).toMatchObject({ id: 42, codigo: 'PCA-42' });
    expect(serviceMock.findOne).toHaveBeenCalledWith(42);
  });

  it('PATCH /estoque/:id retorna envelope de sucesso', async () => {
    serviceMock.update.mockResolvedValueOnce(
      itemSample({ pecasInsumos: 'Novo nome' }),
    );

    const res = await request(app.getHttpServer())
      .patch('/estoque/1')
      .send({ pecasInsumos: 'Novo nome' })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'Item de estoque atualizado com sucesso.',
    });
    expect(serviceMock.update).toHaveBeenCalledWith(1, {
      pecasInsumos: 'Novo nome',
    });
  });

  it('PATCH /estoque/:id/operacao retorna data', async () => {
    const atualizado = itemSample({ quantidadeReservada: 3 });
    serviceMock.executarOperacao.mockResolvedValueOnce(atualizado);

    const res = await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reservar', quantidade: 2 })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: 1 }),
    });
    expect(serviceMock.executarOperacao).toHaveBeenCalledWith(1, {
      operacao: 'reservar',
      quantidade: 2,
    });
  });

  it('PATCH /estoque/:id/operacao com reposicao delega usuário JWT e responde 201', async () => {
    const atualizado = itemSample({ quantidadeFisica: 35 });
    serviceMock.registrarReposicaoEstoque.mockResolvedValueOnce(atualizado);

    const res = await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reposicao', quantidade: 8 })
      .expect(201);

    expect(serviceMock.registrarReposicaoEstoque).toHaveBeenCalledWith(
      1,
      { quantidade: 8 },
      E2E_AUTH_USER_STUB.sub,
    );
    expect(serviceMock.executarOperacao).not.toHaveBeenCalled();
    expect(res.body).toMatchObject({
      success: true,
      message: expect.stringContaining('8'),
      data: expect.objectContaining({ quantidadeFisica: 35 }),
    });
  });

  it('PATCH /estoque/:id/operacao com reposicao responde 400 quantidade inválida', async () => {
    await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reposicao', quantidade: 0 })
      .expect(400);

    expect(serviceMock.registrarReposicaoEstoque).not.toHaveBeenCalled();
  });

  it('DELETE /estoque/:id retorna envelope', async () => {
    serviceMock.remove.mockResolvedValueOnce(itemSample());

    const res = await request(app.getHttpServer())
      .delete('/estoque/99')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(serviceMock.remove).toHaveBeenCalledWith(99);
  });
});
