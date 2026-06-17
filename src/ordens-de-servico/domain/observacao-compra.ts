export const AVISO_AGUARDAR_COMPRA_PECA =
  'Será necessário aguardar a compra de uma ou mais peças/insumos para atender esta ordem de serviço.';

function escapeRegExp(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mergeObservacaoAvisoCompra(
  atual: string | null | undefined,
  precisaAviso: boolean,
): string | null {
  const atualNorm = atual?.trim() ?? '';
  const semAviso = atualNorm
    .replaceAll(
      new RegExp(
        `(\\n|^)${escapeRegExp(AVISO_AGUARDAR_COMPRA_PECA)}(\\n|$)`,
        'g',
      ),
      '\n',
    )
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
  if (!precisaAviso) {
    return semAviso.length > 0 ? semAviso : null;
  }
  if (!semAviso) return AVISO_AGUARDAR_COMPRA_PECA;
  if (semAviso.includes(AVISO_AGUARDAR_COMPRA_PECA)) return semAviso;
  return `${semAviso}\n\n${AVISO_AGUARDAR_COMPRA_PECA}`;
}
