import { In, Repository } from 'typeorm';
import { OrdemServicoTypeormEntity as OrdemServicoEntity } from '../entity/ordem-servico.typeorm.entity';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { StatusOrdemServico as S } from '../../../domain/status-ordem-servico.enum';
import { RelatorioTypeormRepository } from './relatorio.repository';

describe('RelatorioTypeormRepository.tempoMedioServicos', () => {
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

  let osRepo: jest.Mocked<
    Pick<Repository<OrdemServicoEntity>, 'createQueryBuilder'>
  >;
  let histRepo: jest.Mocked<Pick<Repository<HistoricoStatusOsEntity>, 'find'>>;
  let qb: {
    where: jest.Mock;
    innerJoin: jest.Mock;
    andWhere: jest.Mock;
    distinct: jest.Mock;
    getMany: jest.Mock;
  };
  let service: RelatorioTypeormRepository;

  beforeEach(() => {
    qb = {
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    osRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    histRepo = { find: jest.fn() };
    service = new RelatorioTypeormRepository(
      osRepo as unknown as Repository<OrdemServicoEntity>,
      histRepo as unknown as Repository<HistoricoStatusOsEntity>,
    );
  });

  it('soma intervalos em EmExecucao por OS e tira a média', async () => {
    qb.getMany.mockResolvedValue([
      { id: 'os-1' } as OrdemServicoEntity,
      { id: 'os-2' } as OrdemServicoEntity,
    ]);
    histRepo.find.mockResolvedValue([
      ...buildHist('os-1', [
        [S.Recebida, 0],
        [S.EmDiagnostico, 1000],
        [S.AguardandoAprovacao, 2000],
        [S.Aprovada, 3000],
        [S.AguardandoServico, 3500],
        [S.EmExecucao, 4000],
        [S.Finalizada, 6000],
      ]),
      ...buildHist('os-2', [
        [S.Recebida, 0],
        [S.EmExecucao, 1000],
        [S.AguardandoPecasInsumos, 1500],
        [S.AguardandoServico, 2000],
        [S.EmExecucao, 2500],
        [S.Finalizada, 3500],
      ]),
    ]);

    const r = await service.tempoMedioServicos();
    expect(r.totalOSConsideradas).toBe(2);
    expect(r.tempoMedioMs).toBe((2000 + 1500) / 2);
    expect(histRepo.find).toHaveBeenCalledWith({
      where: { os_id: In(['os-1', 'os-2']) },
      order: { createdAt: 'ASC' },
    });
  });

  it('retorna 0 e 0 OSs quando não há OS finalizadas', async () => {
    qb.getMany.mockResolvedValue([]);
    const r = await service.tempoMedioServicos();
    expect(r.tempoMedioMs).toBe(0);
    expect(r.totalOSConsideradas).toBe(0);
  });

  it('ignora OS sem ciclo Em Execução', async () => {
    qb.getMany.mockResolvedValue([{ id: 'os-1' } as OrdemServicoEntity]);
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

  it('aplica filtro de janela na query', async () => {
    qb.getMany.mockResolvedValue([]);
    await service.tempoMedioServicos({
      dataInicio: '2026-01-01',
      dataFim: '2026-05-01',
    });
    expect(qb.innerJoin).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith(
      'h.createdAt >= :dataInicio',
      expect.objectContaining({ dataInicio: expect.any(Date) }),
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'h.createdAt <= :dataFim',
      expect.objectContaining({ dataFim: expect.any(Date) }),
    );
    expect(qb.distinct).toHaveBeenCalledWith(true);
  });
});
