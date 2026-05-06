import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrdemServicoController } from '../src/ordens-de-servico/ordem-servico.controller';
import { ConsultaOrdemServicoController } from '../src/ordens-de-servico/consulta-ordem-servico.controller';
import { OrdemServicoService } from '../src/ordens-de-servico/ordem-servico.service';
import { StatusOrdemServico as S } from '../src/ordens-de-servico/state-machine/status-ordem-servico.enum';
import {
  E2E_AUTH_USER_STUB,
  FakeJwtAuthGuard,
} from './helpers/fake-jwt-auth.guard';

const OS_ID = 'aaaa1111-1111-1111-1111-111111111111';

describe('Ordens de Serviço (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    criar: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findHistorico: jest.fn(),
    iniciarDiagnostico: jest.fn(),
    substituirItensEmDiagnostico: jest.fn(),
    gerarOrcamento: jest.fn(),
    aprovarOrcamento: jest.fn(),
    reprovarOrcamento: jest.fn(),
    iniciarExecucao: jest.fn(),
    finalizar: jest.fn(),
    entregar: jest.fn(),
    cancelar: jest.fn(),
    avancarStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [OrdemServicoController, ConsultaOrdemServicoController],
      providers: [
        { provide: OrdemServicoService, useValue: serviceMock },
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

  it('POST /ordens responde 201 quando o service resolve', async () => {
    serviceMock.criar.mockResolvedValueOnce({ id: 'os-1' });
    const res = await request(app.getHttpServer())
      .post('/ordens')
      .send({
        documentoCliente: '12345678901',
        placa: 'ABC1D23',
        itensServico: [{ servicoId: 1 }],
        itensPeca: [],
      });
    expect(res.status).toBe(201);
    expect(serviceMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({ documentoCliente: '12345678901' }),
      E2E_AUTH_USER_STUB.sub,
    );
  });

  it('POST /ordens responde 400 quando o body é inválido (DTO falha)', async () => {
    const res = await request(app.getHttpServer()).post('/ordens').send({
      documentoCliente: '12', // muito curto
      placa: '',
    });
    expect(res.status).toBe(400);
    expect(serviceMock.criar).not.toHaveBeenCalled();
  });

  it('GET /ordens lista paginada', async () => {
    serviceMock.findAll.mockResolvedValueOnce({ data: [], meta: {} });
    const res = await request(app.getHttpServer()).get(
      '/ordens?page=1&take=10',
    );
    expect(res.status).toBe(200);
    expect(serviceMock.findAll).toHaveBeenCalled();
  });

  it('GET /ordens/:id delega ao service', async () => {
    const os = { id: OS_ID, status: S.EmDiagnostico, valorTotal: 100 };
    serviceMock.findOne.mockResolvedValueOnce(os);

    const res = await request(app.getHttpServer()).get(`/ordens/${OS_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(os);
    expect(serviceMock.findOne).toHaveBeenCalledWith(OS_ID);
  });

  it('GET /ordens/:id/historico delega ao service', async () => {
    const linha = {
      id: 1,
      statusAnterior: S.Recebida,
      statusNovo: S.EmDiagnostico,
    };
    serviceMock.findHistorico.mockResolvedValueOnce([linha]);

    const res = await request(app.getHttpServer()).get(
      `/ordens/${OS_ID}/historico`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([linha]);
    expect(serviceMock.findHistorico).toHaveBeenCalledWith(OS_ID);
  });

  it('GET /ordens/:id/status retorna apenas campos seguros (sem CPF/email)', async () => {
    serviceMock.findOne.mockResolvedValueOnce({
      id: OS_ID,
      status: S.EmExecucao,
      valorTotal: 10,
      updatedAt: new Date('2026-05-01'),
      veiculo: { placa: 'ABC1D23', modelo: 'X' },
      cliente: { documento: '99999999999', email: 'leak@example.com' },
    });
    serviceMock.findHistorico.mockResolvedValueOnce([]);
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
    serviceMock.substituirItensEmDiagnostico.mockResolvedValueOnce(atualizada);
    const body = {
      itensServico: [{ servicoId: 2 }],
      itensPeca: [{ estoqueId: 5, quantidade: 1 }],
    };

    const res = await request(app.getHttpServer())
      .patch(`/ordens/${OS_ID}/itens`)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizada);
    expect(serviceMock.substituirItensEmDiagnostico).toHaveBeenCalledWith(
      OS_ID,
      body,
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
    expect(serviceMock.substituirItensEmDiagnostico).not.toHaveBeenCalled();
  });

  it('GET /ordens/:id com id inválido retorna 400 (ParseUUIDPipe)', async () => {
    const res = await request(app.getHttpServer()).get('/ordens/nao-uuid');

    expect(res.status).toBe(400);
    expect(serviceMock.findOne).not.toHaveBeenCalled();
  });

  it('POST /ordens/:id/aprovar-orcamento delega ao service', async () => {
    serviceMock.aprovarOrcamento.mockResolvedValueOnce({});
    const res = await request(app.getHttpServer()).post(
      `/ordens/${OS_ID}/aprovar-orcamento`,
    );
    expect(res.status).toBe(201);
    expect(serviceMock.aprovarOrcamento).toHaveBeenCalledWith(
      OS_ID,
      E2E_AUTH_USER_STUB.sub,
    );
  });

  it('POST /ordens/:id/avancar-status valida o body', async () => {
    const res = await request(app.getHttpServer())
      .post(`/ordens/${OS_ID}/avancar-status`)
      .send({ novoStatus: 'INVALIDO' });
    expect(res.status).toBe(400);
    expect(serviceMock.avancarStatus).not.toHaveBeenCalled();
  });
});
