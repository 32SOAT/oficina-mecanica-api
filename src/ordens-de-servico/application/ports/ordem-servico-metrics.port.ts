export const ORDEM_SERVICO_METRICS_PORT = Symbol('OrdemServicoMetricsPort');

export interface OrdemServicoMetricsPort {
  registrarCriacao(): void;
}
