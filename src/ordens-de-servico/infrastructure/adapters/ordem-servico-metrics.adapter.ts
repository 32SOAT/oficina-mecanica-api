import { Injectable } from '@nestjs/common';
import tracer from 'dd-trace';
import { OrdemServicoMetricsPort } from '../../application/ports/ordem-servico-metrics.port';

@Injectable()
export class OrdemServicoMetricsAdapter implements OrdemServicoMetricsPort {
  registrarCriacao(): void {
    // dd-trace already adds DD_ENV and DD_SERVICE to its DogStatsD client.
    tracer.dogstatsd.increment('oficina.ordem_servico.criada', 1, {
      status_inicial: 'recebida',
    });
  }
}
