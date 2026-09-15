import { Logger } from '@nestjs/common';
import tracer from 'dd-trace';
import { TempoFaseMetricsPublisher } from './tempo-fase-metrics.publisher';

jest.mock('dd-trace', () => ({
  __esModule: true,
  default: { dogstatsd: { gauge: jest.fn() } },
}));

describe('TempoFaseMetricsPublisher', () => {
  const gauge = jest.spyOn(tracer.dogstatsd, 'gauge');
  let warn: jest.SpyInstance;
  const old = process.env.BUSINESS_METRICS_ENABLED;
  const query = jest.fn();
  const repository = { tempoMedioFases: query, tempoMedioServicos: jest.fn() };
  let publisher: TempoFaseMetricsPublisher;
  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    process.env.BUSINESS_METRICS_ENABLED = 'true';
    query.mockReset().mockResolvedValue([]);
    publisher = new TempoFaseMetricsPublisher(repository);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => {
    publisher.onModuleDestroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    if (old === undefined) delete process.env.BUSINESS_METRICS_ENABLED;
    else process.env.BUSINESS_METRICS_ENABLED = old;
  });
  it('disabled: no query, timer or publication', () => {
    process.env.BUSINESS_METRICS_ENABLED = 'false';
    publisher.onApplicationBootstrap();
    expect(query).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    expect(gauge).not.toHaveBeenCalled();
  });
  it('publishes initially and every minute, only valid phases with fixed tags', async () => {
    query.mockResolvedValue([{ fase: 'diagnostico', segundos: 12 }]);
    publisher.onApplicationBootstrap();
    await settle();
    expect(gauge).toHaveBeenCalledTimes(1);
    expect(gauge).toHaveBeenCalledWith(
      'oficina.ordem_servico.tempo_medio_fase',
      12,
      { fase: 'diagnostico', janela: '24h' },
    );
    await jest.advanceTimersByTimeAsync(60_000);
    expect(query).toHaveBeenCalledTimes(2);
  });
  it('does not publish zero for empty data', async () => {
    publisher.onApplicationBootstrap();
    await settle();
    expect(gauge).not.toHaveBeenCalled();
  });
  it('survives query and DogStatsD errors and retries next cycle', async () => {
    query.mockRejectedValueOnce(new Error('query'));
    publisher.onApplicationBootstrap();
    await settle();
    query.mockResolvedValue([{ fase: 'execucao', segundos: 1 }]);
    gauge.mockImplementationOnce(() => {
      throw Error('send');
    });
    await jest.advanceTimersByTimeAsync(60_000);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(query).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(2);
  });
  it('prevents overlap and stops timer and pending publication on destroy', async () => {
    let resolve!: (rows: unknown[]) => void;
    query.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    publisher.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(120_000);
    expect(query).toHaveBeenCalledTimes(1);
    publisher.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);
    resolve([{ fase: 'execucao', segundos: 1 }]);
    await settle();
    expect(gauge).not.toHaveBeenCalled();
  });
});
