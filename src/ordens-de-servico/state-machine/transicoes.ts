import { StatusOrdemServico as S } from './status-ordem-servico.enum';

export type Transicao = readonly [S, S];

export const transicoesValidas: ReadonlyArray<Transicao> = [
  [S.Recebida, S.EmDiagnostico],
  [S.EmDiagnostico, S.AguardandoAprovacao],
  [S.AguardandoAprovacao, S.Aprovada],
  [S.AguardandoAprovacao, S.Reprovada],
  [S.Aprovada, S.AguardandoServico],
  [S.Aprovada, S.AguardandoPecasInsumos],
  [S.AguardandoServico, S.EmExecucao],
  [S.AguardandoPecasInsumos, S.AguardandoServico],
  [S.EmExecucao, S.Finalizada],
  [S.EmExecucao, S.AguardandoPecasInsumos],
  [S.Finalizada, S.Entregue],
  [S.Reprovada, S.Cancelada],
];

export function ehTransicaoValida(de: S, para: S): boolean {
  return transicoesValidas.some(
    ([origem, destino]) => origem === de && destino === para,
  );
}
