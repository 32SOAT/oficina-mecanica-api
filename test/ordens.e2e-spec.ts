/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrdemServicoController } from '../src/ordens-de-servico/ordem-servico.controller';
import { ConsultaOrdemServicoController } from '../src/ordens-de-servico/consulta-ordem-servico.controller';
import { OrdemServicoService } from '../src/ordens-de-servico/ordem-servico.service';
import { StatusOrdemServico as S } from '../src/ordens-de-servico/state-machine/status-ordem-servico.enum';

describe('Ordens de Serviço (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    criar: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findHistorico: jest.fn(),
    iniciarDiagnostico: jest.fn(),
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
      providers: [{ provide: OrdemServicoService, useValue: serviceMock }],
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
        veiculoId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        itensServico: [{ servicoId: 1 }],
        itensPeca: [],
      });
    expect(res.status).toBe(201);
    expect(serviceMock.criar).toHaveBeenCalled();
  });

  it('POST /ordens responde 400 quando o body é inválido (DTO falha)', async () => {
    const res = await request(app.getHttpServer())
      .post('/ordens')
      .send({
        documentoCliente: '12', // muito curto
        veiculoId: 'not-a-uuid',
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

  it('GET /ordens/:id/status retorna apenas campos seguros (sem CPF/email)', async () => {
    serviceMock.findOne.mockResolvedValueOnce({
      id: 'aaaa1111-1111-1111-1111-111111111111',
      status: S.EmExecucao,
      valorTotal: 10,
      updatedAt: new Date('2026-05-01'),
      veiculo: { placa: 'ABC1D23', modelo: 'X' },
      cliente: { documento: '99999999999', email: 'leak@example.com' },
    });
    serviceMock.findHistorico.mockResolvedValueOnce([]);
    const res = await request(app.getHttpServer()).get(
      '/ordens/aaaa1111-1111-1111-1111-111111111111/status',
    );
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('99999999999');
    expect(body).not.toContain('leak@example.com');
  });

  it('POST /ordens/:id/aprovar-orcamento delega ao service', async () => {
    serviceMock.aprovarOrcamento.mockResolvedValueOnce({});
    const res = await request(app.getHttpServer()).post(
      '/ordens/aaaa1111-1111-1111-1111-111111111111/aprovar-orcamento',
    );
    expect(res.status).toBe(201);
    expect(serviceMock.aprovarOrcamento).toHaveBeenCalledWith(
      'aaaa1111-1111-1111-1111-111111111111',
    );
  });

  it('POST /ordens/:id/avancar-status valida o body', async () => {
    const res = await request(app.getHttpServer())
      .post('/ordens/aaaa1111-1111-1111-1111-111111111111/avancar-status')
      .send({ novoStatus: 'INVALIDO' });
    expect(res.status).toBe(400);
    expect(serviceMock.avancarStatus).not.toHaveBeenCalled();
  });
});
