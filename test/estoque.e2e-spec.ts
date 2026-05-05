/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EstoqueController } from '../src/estoque/estoque.controller';
import { EstoqueService } from '../src/estoque/estoque.service';
import { EstoqueEntity } from '../src/estoque/estoque.entity';

describe('Estoque (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    executarOperacao: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [EstoqueController],
      providers: [{ provide: EstoqueService, useValue: serviceMock }],
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

  it('POST /estoque responde 201 quando o service cria o item', async () => {
    const criado = Object.assign(new EstoqueEntity(), {
      id: 1,
      codigo: 'PCA-E2E-001',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 10,
      quantidadeReservada: 0,
      precoUnitario: 45.5,
    });
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
    const res = await request(app.getHttpServer())
      .post('/estoque')
      .send({
        codigo: '',
        pecasInsumos: 'x',
        quantidadeFisica: -1,
        precoUnitario: 0,
      })
      .expect(400);

    expect(Array.isArray((res.body as { message?: unknown }).message)).toBe(
      true,
    );
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('GET /estoque lista paginada', async () => {
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

  it('GET /estoque/:id retorna o item quando existe', async () => {
    serviceMock.findOne.mockResolvedValueOnce(
      Object.assign(new EstoqueEntity(), {
        id: 42,
        codigo: 'PCA-42',
        pecasInsumos: 'Pastilha',
        quantidadeFisica: 5,
        quantidadeReservada: 0,
        precoUnitario: 120,
      }),
    );

    const res = await request(app.getHttpServer()).get('/estoque/42').expect(200);

    expect(res.body).toMatchObject({ id: 42, codigo: 'PCA-42' });
    expect(serviceMock.findOne).toHaveBeenCalledWith(42);
  });
});
