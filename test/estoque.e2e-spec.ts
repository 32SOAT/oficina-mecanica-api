import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { CreateEstoqueUseCase } from '../src/estoque/application/use-cases/create-estoque.use-case';
import { ExecutarOperacaoEstoqueUseCase } from '../src/estoque/application/use-cases/executar-operacao-estoque.use-case';
import { FindAllEstoquesUseCase } from '../src/estoque/application/use-cases/find-all-estoques.use-case';
import { FindEstoqueByIdUseCase } from '../src/estoque/application/use-cases/find-estoque-by-id.use-case';
import { RegistrarReposicaoEstoqueUseCase } from '../src/estoque/application/use-cases/registrar-reposicao-estoque.use-case';
import { RemoveEstoqueUseCase } from '../src/estoque/application/use-cases/remove-estoque.use-case';
import { UpdateEstoqueUseCase } from '../src/estoque/application/use-cases/update-estoque.use-case';
import { EstoqueController } from '../src/estoque/presentation/controllers/estoque.controller';
import { EstoquePresentationMapper } from '../src/estoque/presentation/mappers/estoque-presentation.mapper';
import {
  E2E_AUTH_USER_STUB,
  FakeJwtAuthGuard,
} from './helpers/fake-jwt-auth.guard';

describe('Estoque (e2e)', () => {
  let app: INestApplication;
  const createEstoqueUseCase = { execute: jest.fn() };
  const findAllEstoquesUseCase = { execute: jest.fn() };
  const findEstoqueByIdUseCase = { execute: jest.fn() };
  const updateEstoqueUseCase = { execute: jest.fn() };
  const registrarReposicaoEstoqueUseCase = { execute: jest.fn() };
  const executarOperacaoEstoqueUseCase = { execute: jest.fn() };
  const removeEstoqueUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [EstoqueController],
      providers: [
        { provide: CreateEstoqueUseCase, useValue: createEstoqueUseCase },
        { provide: FindAllEstoquesUseCase, useValue: findAllEstoquesUseCase },
        { provide: FindEstoqueByIdUseCase, useValue: findEstoqueByIdUseCase },
        { provide: UpdateEstoqueUseCase, useValue: updateEstoqueUseCase },
        {
          provide: RegistrarReposicaoEstoqueUseCase,
          useValue: registrarReposicaoEstoqueUseCase,
        },
        {
          provide: ExecutarOperacaoEstoqueUseCase,
          useValue: executarOperacaoEstoqueUseCase,
        },
        { provide: RemoveEstoqueUseCase, useValue: removeEstoqueUseCase },
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

  const itemSample = (
    overrides: Partial<{
      id: number;
      codigo: string;
      pecasInsumos: string;
      quantidadeFisica: number;
      quantidadeReservada: number;
      quantidadeDisponivel: number;
      precoUnitario: number;
    }> = {},
  ) => ({
    id: 1,
    codigo: 'PCA-E2E-001',
    pecasInsumos: 'Filtro de óleo',
    quantidadeFisica: 10,
    quantidadeReservada: 0,
    quantidadeDisponivel: 10,
    precoUnitario: 45.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  it('POST /estoque responde 201 quando o use case cria o item', async () => {
    const criado = itemSample();
    createEstoqueUseCase.execute.mockResolvedValueOnce(criado);

    const body = {
      codigo: 'PCA-E2E-001',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 10,
      precoUnitario: 45.5,
    };

    const res: SupertestResponse = await request(app.getHttpServer())
      .post('/estoque')
      .send(body)
      .expect(201);
    const responseBody = res.body as {
      id: number;
      codigo: string;
      pecasInsumos: string;
      quantidadeFisica: number;
      precoUnitario: number;
    };
    expect(responseBody.id).toBe(1);
    expect(responseBody.codigo).toBe(body.codigo);
    expect(responseBody.pecasInsumos).toBe(body.pecasInsumos);
    expect(responseBody.quantidadeFisica).toBe(body.quantidadeFisica);
    expect(typeof responseBody.precoUnitario).toBe('number');
    expect(createEstoqueUseCase.execute).toHaveBeenCalledWith(
      EstoquePresentationMapper.toCreateInput(body),
    );
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

    expect(createEstoqueUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /estoque lista paginada (estoque_baixo=false por padrão)', async () => {
    findAllEstoquesUseCase.execute.mockResolvedValueOnce({
      data: [],
      meta: { itemsPerPage: 10, totalItems: 0, currentPage: 1 },
    });

    const res: SupertestResponse = await request(app.getHttpServer())
      .get('/estoque?page=1&take=10')
      .expect(200);
    const responseBody = res.body as { data: unknown[] };
    expect(responseBody.data).toEqual([]);
    expect(findAllEstoquesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, take: 10, estoqueBaixo: false }),
    );
  });

  it('GET /estoque com estoque_baixo=true repassa filtro ao use case', async () => {
    findAllEstoquesUseCase.execute.mockResolvedValueOnce({ data: [], meta: {} });

    await request(app.getHttpServer())
      .get('/estoque?page=1&take=5&estoque_baixo=true')
      .expect(200);

    expect(findAllEstoquesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, take: 5, estoqueBaixo: true }),
    );
  });

  it('GET /estoque/:id retorna o item quando existe', async () => {
    findEstoqueByIdUseCase.execute.mockResolvedValueOnce(
      itemSample({ id: 42, codigo: 'PCA-42' }),
    );

    const res: SupertestResponse = await request(app.getHttpServer())
      .get('/estoque/42')
      .expect(200);
    const responseBody = res.body as { id: number; codigo: string };
    expect(responseBody).toMatchObject({ id: 42, codigo: 'PCA-42' });
    expect(findEstoqueByIdUseCase.execute).toHaveBeenCalledWith(42);
  });

  it('PATCH /estoque/:id retorna envelope de sucesso', async () => {
    updateEstoqueUseCase.execute.mockResolvedValueOnce(undefined);

    const res: SupertestResponse = await request(app.getHttpServer())
      .patch('/estoque/1')
      .send({ pecasInsumos: 'Novo nome' })
      .expect(200);
    const responseBody = res.body as { success: boolean; message: string };
    expect(responseBody).toEqual({
      success: true,
      message: 'Item de estoque atualizado com sucesso.',
    });
    expect(updateEstoqueUseCase.execute).toHaveBeenCalledWith(
      1,
      EstoquePresentationMapper.toUpdateInput({ pecasInsumos: 'Novo nome' }),
    );
  });

  it('PATCH /estoque/:id/operacao retorna data', async () => {
    const atualizado = itemSample({ quantidadeReservada: 3 });
    executarOperacaoEstoqueUseCase.execute.mockResolvedValueOnce(atualizado);

    const res: SupertestResponse = await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reservar', quantidade: 2 })
      .expect(200);
    const responseBody = res.body as { success: boolean; data: { id: number } };
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.id).toBe(1);
    expect(executarOperacaoEstoqueUseCase.execute).toHaveBeenCalledWith(
      1,
      EstoquePresentationMapper.toOperacaoInput({
        operacao: 'reservar',
        quantidade: 2,
      }),
    );
  });

  it('PATCH /estoque/:id/operacao com baixa delega a executarOperacao', async () => {
    const atualizado = itemSample({
      quantidadeFisica: 7,
      quantidadeReservada: 2,
      quantidadeDisponivel: 5,
    });
    executarOperacaoEstoqueUseCase.execute.mockResolvedValueOnce(atualizado);

    const res: SupertestResponse = await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'baixa', quantidade: 1 })
      .expect(200);
    const responseBody = res.body as {
      success: boolean;
      data: { quantidadeFisica: number };
    };
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.quantidadeFisica).toBe(7);
    expect(executarOperacaoEstoqueUseCase.execute).toHaveBeenCalledWith(
      1,
      EstoquePresentationMapper.toOperacaoInput({
        operacao: 'baixa',
        quantidade: 1,
      }),
    );
    expect(registrarReposicaoEstoqueUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /estoque/:id/operacao com reposicao delega usuário JWT e responde 201', async () => {
    const atualizado = itemSample({ quantidadeFisica: 35, quantidadeDisponivel: 35 });
    registrarReposicaoEstoqueUseCase.execute.mockResolvedValueOnce(atualizado);

    const res: SupertestResponse = await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reposicao', quantidade: 8 })
      .expect(201);

    expect(registrarReposicaoEstoqueUseCase.execute).toHaveBeenCalledWith(
      1,
      EstoquePresentationMapper.toReposicaoInput(8, E2E_AUTH_USER_STUB.sub),
    );
    expect(executarOperacaoEstoqueUseCase.execute).not.toHaveBeenCalled();
    const responseBody = res.body as {
      success: boolean;
      message: string;
      data: { quantidadeFisica: number };
    };
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toContain('8');
    expect(responseBody.data.quantidadeFisica).toBe(35);
  });

  it('PATCH /estoque/:id/operacao com reposicao responde 400 quantidade inválida', async () => {
    await request(app.getHttpServer())
      .patch('/estoque/1/operacao')
      .send({ operacao: 'reposicao', quantidade: 0 })
      .expect(400);

    expect(registrarReposicaoEstoqueUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /estoque/:id retorna envelope', async () => {
    removeEstoqueUseCase.execute.mockResolvedValueOnce(undefined);

    const res: SupertestResponse = await request(app.getHttpServer())
      .delete('/estoque/99')
      .expect(200);
    const responseBody = res.body as { success: boolean };
    expect(responseBody.success).toBe(true);
    expect(removeEstoqueUseCase.execute).toHaveBeenCalledWith(99);
  });
});
