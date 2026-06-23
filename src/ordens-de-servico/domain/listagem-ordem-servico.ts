import { StatusOrdemServico } from './status-ordem-servico.enum';

export const STATUS_EXCLUIDOS_LISTAGEM_PADRAO: readonly StatusOrdemServico[] = [
  StatusOrdemServico.Finalizada,
  StatusOrdemServico.Entregue,
  StatusOrdemServico.Cancelada,
];

export const PRIORIDADE_STATUS_LISTAGEM: readonly StatusOrdemServico[] = [
  StatusOrdemServico.EmExecucao,
  StatusOrdemServico.AguardandoServico,
  StatusOrdemServico.AguardandoPecasInsumos,
  StatusOrdemServico.AguardandoAprovacao,
  StatusOrdemServico.EmDiagnostico,
  StatusOrdemServico.Recebida,
];

/** Prioridade de status fora de {@link PRIORIDADE_STATUS_LISTAGEM} (vão após os prioritários). */
export const PRIORIDADE_LISTAGEM_FALLBACK = 99;

export function prioridadeStatusListagem(status: StatusOrdemServico): number {
  const index = PRIORIDADE_STATUS_LISTAGEM.indexOf(status);
  return index === -1 ? PRIORIDADE_LISTAGEM_FALLBACK : index + 1;
}
