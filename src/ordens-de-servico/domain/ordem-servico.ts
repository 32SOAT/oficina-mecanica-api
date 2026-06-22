import { ehTransicaoValida } from './transicoes';
import { StatusOrdemServico } from './status-ordem-servico.enum';
import { TransicaoInvalidaError } from './errors/transicao-invalida.error';

export type ItemServicoValor = { precoAplicado: number };
export type ItemPecaValor = {
  precoAplicado: number;
  quantidade: number;
  disponivelNoDiagnostico: boolean;
};

export function avancarStatusOrdemServico(
  statusAtual: StatusOrdemServico,
  novo: StatusOrdemServico,
): { anterior: StatusOrdemServico; novo: StatusOrdemServico } {
  if (!ehTransicaoValida(statusAtual, novo)) {
    throw new TransicaoInvalidaError(statusAtual, novo);
  }
  return { anterior: statusAtual, novo };
}

export function calcularValorTotalOrdemServico(
  itensServico: ItemServicoValor[],
  itensPeca: ItemPecaValor[],
): number {
  const totalServicos = itensServico.reduce(
    (acc, i) => acc + Number(i.precoAplicado),
    0,
  );
  const totalPecas = itensPeca.reduce(
    (acc, i) => acc + Number(i.precoAplicado) * i.quantidade,
    0,
  );
  return Number((totalServicos + totalPecas).toFixed(2));
}

export function todasPecasDisponiveis(itensPeca: ItemPecaValor[]): boolean {
  return itensPeca.every((p) => p.disponivelNoDiagnostico);
}
