import {
  PRIORIDADE_LISTAGEM_FALLBACK,
  PRIORIDADE_STATUS_LISTAGEM,
  prioridadeStatusListagem,
} from '../../../domain/listagem-ordem-servico';

export function buildPrioridadeStatusListagemCaseSql(
  statusColumn: string,
): string {
  const cases = PRIORIDADE_STATUS_LISTAGEM.map(
    (status) => `WHEN '${status}' THEN ${prioridadeStatusListagem(status)}`,
  ).join(' ');

  return `CASE ${statusColumn} ${cases} ELSE ${PRIORIDADE_LISTAGEM_FALLBACK} END`;
}
