import { RelatorioController } from './relatorio.controller';
import { GetTempoMedioServicosUseCase } from '../../application/use-cases/get-tempo-medio-servicos.use-case';

describe('RelatorioController', () => {
  it('GET /relatorios/tempo-medio-servicos delega ao use case', async () => {
    const getTempoMedioServicosUseCase = {
      execute: jest.fn().mockResolvedValue({
        tempoMedioMs: 100,
        tempoMedioFormatado: '0h 0min',
        totalOSConsideradas: 1,
        janela: { dataInicio: '2026-01-01', dataFim: '2026-05-01' },
      }),
    } as unknown as GetTempoMedioServicosUseCase;

    const controller = new RelatorioController(getTempoMedioServicosUseCase);
    const r = await controller.tempoMedio({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(getTempoMedioServicosUseCase.execute).toHaveBeenCalledWith({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(r.tempoMedioMs).toBe(100);
  });
});
