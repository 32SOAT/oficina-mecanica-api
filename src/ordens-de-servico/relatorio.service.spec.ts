import { Repository } from 'typeorm';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { StatusOrdemServico as S } from './state-machine/status-ordem-servico.enum';
import { RelatorioService } from './relatorio.service';

describe('RelatorioService.tempoMedioServicos', () => {
  const buildHist = (
    osId: string,
    entries: Array<[S, number]>,
  ): HistoricoStatusOsEntity[] => {
    let prev: S | null = null;
    return entries.map(([statusNovo, tsMs]) => {
      const h = new HistoricoStatusOsEntity();
      Object.assign(h, {
        os_id: osId,
        statusAnterior: prev,
        statusNovo,
        createdAt: new Date(tsMs),
      });
      prev = statusNovo;
      return h;
    });
  };

  let osRepo: jest.Mocked<Pick<Repository<OrdemServicoEntity>, 'find'>>;
  let histRepo: jest.Mocked<Pick<Repository<HistoricoStatusOsEntity>, 'find'>>;
  let service: RelatorioService;

  beforeEach(() => {
    osRepo = { find: jest.fn() };
    histRepo = { find: jest.fn() };
    service = new RelatorioService(
      osRepo as unknown as Repository<OrdemServicoEntity>,
      histRepo as unknown as Repository<HistoricoStatusOsEntity>,
    );
  });

  it('soma intervalos em EmExecucao por OS e tira a média', async () => {
    osRepo.find.mockResolvedValue([
      { id: 'os-1' } as OrdemServicoEntity,
      { id: 'os-2' } as OrdemServicoEntity,
    ]);
    histRepo.find.mockImplementation((opts: unknown) => {
      const where = (opts as { where: { os_id: string } }).where;
      if (where.os_id === 'os-1') {
        return Promise.resolve(
          buildHist('os-1', [
            [S.Recebida, 0],
            [S.EmDiagnostico, 1000],
            [S.AguardandoAprovacao, 2000],
            [S.Aprovada, 3000],
            [S.AguardandoServico, 3500],
            [S.EmExecucao, 4000],
            [S.Finalizada, 6000], // 2000ms em execução
          ]),
        );
      }
      if (where.os_id === 'os-2') {
        return Promise.resolve(
          buildHist('os-2', [
            [S.Recebida, 0],
            [S.EmExecucao, 1000],
            [S.AguardandoPecasInsumos, 1500], // 500ms em execução
            [S.AguardandoServico, 2000],
            [S.EmExecucao, 2500],
            [S.Finalizada, 3500], // +1000ms em execução = 1500ms total
          ]),
        );
      }
      return Promise.resolve([]);
    });

    const r = await service.tempoMedioServicos();
    expect(r.totalOSConsideradas).toBe(2);
    expect(r.tempoMedioMs).toBe((2000 + 1500) / 2); // 1750ms
  });

  it('retorna 0 e 0 OSs quando não há OS finalizadas', async () => {
    osRepo.find.mockResolvedValue([]);
    const r = await service.tempoMedioServicos();
    expect(r.tempoMedioMs).toBe(0);
    expect(r.totalOSConsideradas).toBe(0);
  });

  it('ignora OS sem ciclo Em Execução', async () => {
    osRepo.find.mockResolvedValue([{ id: 'os-1' } as OrdemServicoEntity]);
    histRepo.find.mockResolvedValue(
      buildHist('os-1', [
        [S.Recebida, 0],
        [S.EmDiagnostico, 1000],
        [S.Reprovada, 2000],
      ]),
    );
    const r = await service.tempoMedioServicos();
    expect(r.totalOSConsideradas).toBe(0);
    expect(r.tempoMedioMs).toBe(0);
  });

  it('ecoa a janela quando fornecida', async () => {
    osRepo.find.mockResolvedValue([]);
    const r = await service.tempoMedioServicos({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(r.janela).toEqual({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
  });
});
