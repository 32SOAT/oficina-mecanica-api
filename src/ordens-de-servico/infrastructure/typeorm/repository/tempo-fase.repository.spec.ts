import { Repository } from 'typeorm';
import { RelatorioTypeormRepository } from './relatorio.repository';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { OrdemServicoTypeormEntity } from '../entity/ordem-servico.typeorm.entity';
import { StatusOrdemServico as S } from '../../../domain/status-ordem-servico.enum';

describe('Historical phase averages', () => {
  const now = new Date('2026-09-13T12:00:00Z');
  const row = (
    anterior: S | null,
    novo: S,
    hours: number,
    os = 'internal-id',
  ) =>
    ({
      os_id: os,
      statusAnterior: anterior,
      statusNovo: novo,
      createdAt: new Date(now.getTime() - hours * 3600_000),
    }) as HistoricoStatusOsEntity;
  const calculate = (rows: HistoricoStatusOsEntity[]) => {
    const history = { find: jest.fn().mockResolvedValue(rows) };
    return new RelatorioTypeormRepository(
      {} as Repository<OrdemServicoTypeormEntity>,
      history as unknown as Repository<HistoricoStatusOsEntity>,
    ).tempoMedioFases();
  };
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterEach(() => jest.useRealTimers());
  it.each([
    ['diagnostico', S.EmDiagnostico, S.AguardandoAprovacao],
    ['execucao', S.EmExecucao, S.Finalizada],
    ['finalizacao', S.Finalizada, S.Entregue],
  ] as const)(
    'calculates %s including entry before the window',
    async (fase, de, para) => {
      expect(await calculate([row(null, de, 30), row(de, para, 2)])).toEqual([
        { fase, segundos: 28 * 3600 },
      ]);
    },
  );
  it('averages completed intervals, excludes exits outside window and future exits', async () => {
    expect(
      await calculate([
        row(null, S.EmExecucao, 3, 'a'),
        row(S.EmExecucao, S.Finalizada, 1, 'a'),
        row(null, S.EmExecucao, 5, 'b'),
        row(S.EmExecucao, S.Finalizada, 1, 'b'),
        row(null, S.EmExecucao, 40, 'c'),
        row(S.EmExecucao, S.Finalizada, 25, 'c'),
        row(null, S.EmExecucao, 1, 'd'),
        row(S.EmExecucao, S.Finalizada, -1, 'd'),
      ]),
    ).toEqual([{ fase: 'execucao', segundos: 3 * 3600 }]);
  });
  it('ignores missing entries, open phases, negatives and ambiguous pairs', async () => {
    expect(
      await calculate([
        row(null, S.EmExecucao, 3, 'open'),
        row(S.EmExecucao, S.Finalizada, 1, 'missing'),
        row(null, S.EmExecucao, 1, 'negative'),
        row(S.EmExecucao, S.Finalizada, 2, 'negative'),
        row(null, S.EmExecucao, 4, 'duplicate'),
        row(null, S.EmExecucao, 3, 'duplicate'),
        row(S.EmExecucao, S.Finalizada, 1, 'duplicate'),
      ]),
    ).toEqual([]);
  });
  it('ignores duplicate exits and intervening transitions', async () => {
    expect(
      await calculate([
        row(null, S.EmExecucao, 3, 'a'),
        row(S.EmExecucao, S.Finalizada, 2, 'a'),
        row(S.EmExecucao, S.Finalizada, 1, 'a'),
        row(null, S.EmExecucao, 3, 'b'),
        row(S.Recebida, S.EmDiagnostico, 2, 'b'),
        row(S.EmExecucao, S.Finalizada, 1, 'b'),
      ]),
    ).toEqual([]);
  });
  it('returns no phases when history is empty', async () => {
    expect(await calculate([])).toEqual([]);
  });
});
