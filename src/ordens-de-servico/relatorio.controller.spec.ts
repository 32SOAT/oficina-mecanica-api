import { RelatorioController } from './relatorio.controller';
import { RelatorioService } from './relatorio.service';

describe('RelatorioController', () => {
  it('GET /relatorios/tempo-medio-servicos delega ao service', async () => {
    const service = {
      tempoMedioServicos: jest.fn().mockResolvedValue({
        tempoMedioMs: 100,
        tempoMedioFormatado: '0h 0min',
        totalOSConsideradas: 1,
        janela: { dataInicio: '2026-01-01', dataFim: '2026-05-01' },
      }),
    } as unknown as RelatorioService;

    const controller = new RelatorioController(service);
    const r = await controller.tempoMedio({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(service.tempoMedioServicos).toHaveBeenCalledWith({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(r.tempoMedioMs).toBe(100);
  });
});
