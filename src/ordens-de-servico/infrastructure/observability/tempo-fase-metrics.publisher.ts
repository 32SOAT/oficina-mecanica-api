import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import tracer from 'dd-trace';
import {
  RELATORIO_REPOSITORY,
  RelatorioRepository,
} from '../../application/ports/relatorio.repository';

@Injectable()
export class TempoFaseMetricsPublisher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TempoFaseMetricsPublisher.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopped = false;

  constructor(
    @Inject(RELATORIO_REPOSITORY)
    private readonly repository: RelatorioRepository,
  ) {}

  onApplicationBootstrap(): void {
    if (
      process.env.BUSINESS_METRICS_ENABLED !== 'true' ||
      this.timer ||
      this.stopped
    )
      return;
    this.timer = setInterval(() => {
      void this.collect();
    }, 60_000);
    this.timer.unref();
    void this.collect();
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private async collect(): Promise<void> {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      const medias = await this.repository.tempoMedioFases();
      if (this.stopped) return;
      for (const { fase, segundos } of medias) {
        try {
          tracer.dogstatsd.gauge(
            'oficina.ordem_servico.tempo_medio_fase',
            segundos,
            {
              fase,
              janela: '24h',
            },
          );
        } catch {
          this.logger.warn('Falha ao publicar tempo médio por fase.');
        }
      }
    } catch {
      this.logger.warn('Falha ao consultar tempo médio por fase.');
    } finally {
      this.running = false;
    }
  }
}
