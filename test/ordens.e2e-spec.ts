import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AprovarOrcamentoOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/aprovar-orcamento-ordem-servico.use-case';
import { AvancarStatusOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/avancar-status-ordem-servico.use-case';
import { CreateOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/create-ordem-servico.use-case';
import { FindAllOrdensServicoUseCase } from '../src/ordens-de-servico/application/use-cases/find-all-ordens-servico.use-case';
import { FindOrdemServicoByIdUseCase } from '../src/ordens-de-servico/application/use-cases/find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from '../src/ordens-de-servico/application/use-cases/find-ordem-servico-historico.use-case';
import { GerarOrcamentoOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/gerar-orcamento-ordem-servico.use-case';
import { IniciarExecucaoOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/iniciar-execucao-ordem-servico.use-case';
import { ReprovarOrcamentoOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/reprovar-orcamento-ordem-servico.use-case';
import { SubstituirItensOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/substituir-itens-ordem-servico.use-case';
import { TransicionarOrdemServicoUseCase } from '../src/ordens-de-servico/application/use-cases/transicionar-ordem-servico.use-case';
import { StatusOrdemServico as S } from '../src/ordens-de-servico/domain/status-ordem-servico.enum';
import { ConsultaOrdemServicoController } from '../src/ordens-de-servico/presentation/controllers/consulta-ordem-servico.controller';
import { OrdemServicoController } from '../src/ordens-de-servico/presentation/controllers/ordem-servico.controller';
import { OrdemServicoPresentationMapper } from '../src/ordens-de-servico/presentation/mappers/ordem-servico-presentation.mapper';
import {
  E2E_AUTH_USER_STUB,
  FakeJwtAuthGuard,
} from './helpers/fake-jwt-auth.guard';

const OS_ID = 'aaaa1111-1111-1111-1111-111111111111';

describe('Ordens de Serviço (e2e)', () => {
  let app: INestApplication;
  const createOrdemServicoUseCase = { execute: jest.fn() };
  const findAllOrdensServicoUseCase = { execute: jest.fn() };
  const findOrdemServicoByIdUseCase = { execute: jest.fn() };
  const findOrdemServicoHistoricoUseCase = { execute: jest.fn() };
  const transicionarOrdemServicoUseCase = { execute: jest.fn() };
  const substituirItensOrdemServicoUseCase = { execute: jest.fn() };
  const gerarOrcamentoOrdemServicoUseCase = { execute: jest.fn() };
  const aprovarOrcamentoOrdemServicoUseCase = { execute: jest.fn() };
  const reprovarOrcamentoOrdemServicoUseCase = { execute: jest.fn() };
  const iniciarExecucaoOrdemServicoUseCase = { execute: jest.fn() };
  const avancarStatusOrdemServicoUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [OrdemServicoController, ConsultaOrdemServicoController],
      providers: [
        {
          provide: CreateOrdemServicoUseCase,
          useValue: createOrdemServicoUseCase,
        },
        {
          provide: FindAllOrdensServicoUseCase,
          useValue: findAllOrdensServicoUseCase,
        },
        {
          provide: FindOrdemServicoByIdUseCase,
          useValue: findOrdemServicoByIdUseCase,
        },
        {
          provide: FindOrdemServicoHistoricoUseCase,
          useValue: findOrdemServicoHistoricoUseCase,
        },
        {
          provide: TransicionarOrdemServicoUseCase,
          useValue: transicionarOrdemServicoUseCase,
        },
        {
          provide: SubstituirItensOrdemServicoUseCase,
          useValue: substituirItensOrdemServicoUseCase,
        },
        {
          provide: GerarOrcamentoOrdemServicoUseCase,
          useValue: gerarOrcamentoOrdemServicoUseCase,
        },
        {
          provide: AprovarOrcamentoOrdemServicoUseCase,
          useValue: aprovarOrcamentoOrdemServicoUseCase,
        },
        {
          provide: ReprovarOrcamentoOrdemServicoUseCase,
          useValue: reprovarOrcamentoOrdemServicoUseCase,
        },
        {
          provide: IniciarExecucaoOrdemServicoUseCase,
          useValue: iniciarExecucaoOrdemServicoUseCase,
        },
        {
          provide: AvancarStatusOrdemServicoUseCase,
          useValue: avancarStatusOrdemServicoUseCase,
        },
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

  it('POST /ordens responde 201 quando o use case resolve', async () => {
    createOrdemServicoUseCase.execute.mockResolvedValueOnce({ id: 'os-1' });
    const body = {
      documentoCliente: '12345678901',
      placa: 'ABC1D23',
      itensServico: [{ servicoId: 1 }],
      itensPeca: [],
    };
    const res = await request(app.getHttpServer()).post('/ordens').send(body);
    expect(res.status).toBe(201);
    expect(createOrdemServicoUseCase.execute).toHaveBeenCalledWith(
      OrdemServicoPresentationMapper.toCreateInput(body),
      E2E_AUTH_USER_STUB.sub,
    );
  });

  it('POST /ordens responde 400 quando o body é inválido (DTO falha)', async () => {
    const res = await request(app.getHttpServer()).post('/ordens').send({
      documentoCliente: '12',
      placa: '',
    });
    expect(res.status).toBe(400);
    expect(createOrdemServicoUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /ordens lista paginada', async () => {
    findAllOrdensServicoUseCase.execute.mockResolvedValueOnce({
      data: [],
      meta: {},
    });
    const res = await request(app.getHttpServer()).get(
      '/ordens?page=1&take=10',
    );
    expect(res.status).toBe(200);
    expect(findAllOrdensServicoUseCase.execute).toHaveBeenCalled();
  });

  it('GET /ordens/:id delega ao use case', async () => {
    const os = { id: OS_ID, status: S.EmDiagnostico, valorTotal: 100 };
    findOrdemServicoByIdUseCase.execute.mockResolvedValueOnce(os);

    const res = await request(app.getHttpServer()).get(`/ordens/${OS_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(os);
    expect(findOrdemServicoByIdUseCase.execute).toHaveBeenCalledWith(OS_ID);
  });

  it('GET /ordens/:id/historico delega ao use case', async () => {
    const linha = {
      id: 1,
      statusAnterior: S.Recebida,
      statusNovo: S.EmDiagnostico,
    };
    findOrdemServicoHistoricoUseCase.execute.mockResolvedValueOnce([linha]);

    const res = await request(app.getHttpServer()).get(
      `/ordens/${OS_ID}/historico`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([linha]);
    expect(findOrdemServicoHistoricoUseCase.execute).toHaveBeenCalledWith(
      OS_ID,
    );
  });

  it('GET /ordens/:id/status retorna apenas campos seguros (sem CPF/email)', async () => {
    findOrdemServicoByIdUseCase.execute.mockResolvedValueOnce({
      id: OS_ID,
      status: S.EmExecucao,
      valorTotal: 10,
      updatedAt: new Date('2026-05-01'),
      veiculo: { placa: 'ABC1D23', modelo: 'X' },
      cliente: { documento: '99999999999', email: 'leak@example.com' },
    });
    findOrdemServicoHistoricoUseCase.execute.mockResolvedValueOnce([]);
    const res = await request(app.getHttpServer()).get(
      `/ordens/${OS_ID}/status`,
    );
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('99999999999');
    expect(body).not.toContain('leak@example.com');
  });

  it('PATCH /ordens/:id/itens delega DTO e sub do JWT', async () => {
    const atualizada = { id: OS_ID, status: S.EmDiagnostico };
    substituirItensOrdemServicoUseCase.execute.mockResolvedValueOnce(
      atualizada,
    );
    const body = {
      itensServico: [{ servicoId: 2 }],
      itensPeca: [{ estoqueId: 5, quantidade: 1 }],
    };

    const res = await request(app.getHttpServer())
      .patch(`/ordens/${OS_ID}/itens`)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizada);
    expect(substituirItensOrdemServicoUseCase.execute).toHaveBeenCalledWith(
      OS_ID,
      OrdemServicoPresentationMapper.toEditarItensInput(body),
      E2E_AUTH_USER_STUB.sub,
    );
  });

  it('PATCH /ordens/:id/itens responde 400 quando itensServico não é array', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/ordens/${OS_ID}/itens`)
      .send({
        itensServico: { servicoId: 1 },
        itensPeca: [],
      });

    expect(res.status).toBe(400);
    expect(substituirItensOrdemServicoUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /ordens/:id com id inválido retorna 400 (ParseUUIDPipe)', async () => {
    const res = await request(app.getHttpServer()).get('/ordens/nao-uuid');

    expect(res.status).toBe(400);
    expect(findOrdemServicoByIdUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST /ordens/:id/aprovar-orcamento delega ao use case', async () => {
    aprovarOrcamentoOrdemServicoUseCase.execute.mockResolvedValueOnce({});
    const res = await request(app.getHttpServer()).post(
      `/ordens/${OS_ID}/aprovar-orcamento`,
    );
    expect(res.status).toBe(201);
    expect(aprovarOrcamentoOrdemServicoUseCase.execute).toHaveBeenCalledWith(
      OS_ID,
      null,
    );
  });

  it('POST /ordens/:id/avancar-status valida o body', async () => {
    const res = await request(app.getHttpServer())
      .post(`/ordens/${OS_ID}/avancar-status`)
      .send({ novoStatus: 'INVALIDO' });
    expect(res.status).toBe(400);
    expect(avancarStatusOrdemServicoUseCase.execute).not.toHaveBeenCalled();
  });
});
