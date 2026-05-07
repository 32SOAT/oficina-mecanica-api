import { ConsultaOrdemServicoController } from './consulta-ordem-servico.controller';
import { OrdemServicoService } from './ordem-servico.service';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { StatusOrdemServico as S } from './state-machine/status-ordem-servico.enum';

describe('ConsultaOrdemServicoController', () => {
  let controller: ConsultaOrdemServicoController;
  let service: jest.Mocked<
    Pick<OrdemServicoService, 'findOne' | 'findHistorico'>
  >;

  beforeEach(() => {
    service = {
      findOne: jest.fn(),
      findHistorico: jest.fn(),
    };
    controller = new ConsultaOrdemServicoController(
      service as unknown as OrdemServicoService,
    );
  });

  it('retorna apenas campos seguros (sem CPF/email do cliente)', async () => {
    const os = new OrdemServicoEntity();
    Object.assign(os, {
      id: 'os-1',
      status: S.EmExecucao,
      valorTotal: 100,
      updatedAt: new Date('2026-05-01T18:30:00.000Z'),
      veiculo: { placa: 'ABC1D23', modelo: 'Corolla' },
      cliente: { documento: '12345678901', email: 'leak@example.com' },
    });
    service.findOne.mockResolvedValue(os);
    const h1 = new HistoricoStatusOsEntity();
    Object.assign(h1, {
      statusNovo: S.Recebida,
      createdAt: new Date('2026-04-30T10:00:00.000Z'),
    });
    service.findHistorico.mockResolvedValue([h1]);

    const result = await controller.consultarStatus('os-1');
    const json = JSON.stringify(result);
    expect(json).not.toContain('12345678901');
    expect(json).not.toContain('leak@example.com');
    expect(result.veiculo.placa).toBe('ABC1D23');
    expect(result.veiculo.modelo).toBe('Corolla');
    expect(result.linhaDoTempo).toHaveLength(1);
    expect(result.linhaDoTempo[0].status).toBe(S.Recebida);
    expect(result.id).toBe('os-1');
    expect(result.status).toBe(S.EmExecucao);
    expect(result.valorTotal).toBe(100);
  });

  it('transforma valorTotal (string da numeric do Postgres) em número', async () => {
    const os = new OrdemServicoEntity();
    Object.assign(os, {
      id: 'os-1',
      status: S.Recebida,
      valorTotal: '850.00' as unknown as number,
      updatedAt: new Date(),
      veiculo: { placa: 'X', modelo: 'Y' },
      cliente: {},
    });
    service.findOne.mockResolvedValue(os);
    service.findHistorico.mockResolvedValue([]);
    const result = await controller.consultarStatus('os-1');
    expect(typeof result.valorTotal).toBe('number');
    expect(result.valorTotal).toBe(850);
  });
});
