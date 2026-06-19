import { GetTempoMedioServicosUseCase } from './get-tempo-medio-servicos.use-case';
import type { RelatorioRepository } from '../ports/relatorio.repository';

describe('GetTempoMedioServicosUseCase', () => {
  it('delega ao relatorio repository', async () => {
    const relatorio: RelatorioRepository = {
      tempoMedioServicos: jest.fn().mockResolvedValue({
        tempoMedioMs: 1000,
        tempoMedioFormatado: '0h 1min',
        totalOSConsideradas: 1,
        janela: null,
      }),
    };

    const useCase = new GetTempoMedioServicosUseCase(relatorio as never);
    const result = await useCase.execute({
      dataInicio: '2026-01-01',
      dataFim: '2026-06-01',
    });

    expect(relatorio.tempoMedioServicos).toHaveBeenCalledWith({
      dataInicio: '2026-01-01',
      dataFim: '2026-06-01',
    });
    expect(result.totalOSConsideradas).toBe(1);
  });
});
