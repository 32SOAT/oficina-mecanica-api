import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export const ORDEM_SERVICO_EVENTS_PORT = 'ORDEM_SERVICO_EVENTS_PORT';

export abstract class OrdemServicoEventsPort {
  abstract emitStatusAlterado(
    osId: string,
    statusAnterior: StatusOrdemServico | null,
    statusNovo: StatusOrdemServico,
    usuarioId: string | null,
  ): void;
  abstract emitOsCriada(osId: string): void;
  abstract emitOrcamentoGerado(osId: string): void;
  abstract emitOrcamentoAprovado(osId: string): void;
  abstract emitOrcamentoReprovado(osId: string): void;
  abstract emitOsEmExecucao(osId: string): void;
}
