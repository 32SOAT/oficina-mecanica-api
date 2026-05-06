import {
  StatusOrdemServico as S,
  STATUS_TERMINAIS,
} from './status-ordem-servico.enum';
import { ehTransicaoValida, transicoesValidas } from './transicoes';

describe('transicoesValidas', () => {
  const casos: Array<[S, S]> = [
    [S.Recebida, S.EmDiagnostico],
    [S.EmDiagnostico, S.AguardandoAprovacao],
    [S.AguardandoAprovacao, S.Aprovada],
    [S.AguardandoAprovacao, S.Reprovada],
    [S.Aprovada, S.AguardandoServico],
    [S.Aprovada, S.AguardandoPecasInsumos],
    [S.AguardandoServico, S.EmExecucao],
    [S.AguardandoPecasInsumos, S.AguardandoServico],
    [S.EmExecucao, S.Finalizada],
    [S.Finalizada, S.Entregue],
    [S.Reprovada, S.Cancelada],
  ];

  it.each(casos)('aceita transição %s → %s', (de, para) => {
    expect(ehTransicaoValida(de, para)).toBe(true);
  });

  it('rejeita transição arbitrária inválida (Recebida → Entregue)', () => {
    expect(ehTransicaoValida(S.Recebida, S.Entregue)).toBe(false);
  });

  it('rejeita saída de estado terminal Entregue', () => {
    expect(ehTransicaoValida(S.Entregue, S.EmExecucao)).toBe(false);
  });

  it('rejeita saída de estado terminal Cancelada', () => {
    expect(ehTransicaoValida(S.Cancelada, S.Aprovada)).toBe(false);
  });

  it('rejeita transição para o próprio estado', () => {
    expect(ehTransicaoValida(S.EmExecucao, S.EmExecucao)).toBe(false);
  });

  it('expõe exatamente 12 transições válidas', () => {
    expect(transicoesValidas).toHaveLength(11);
  });

  it('nenhum estado terminal possui transição de saída em transicoesValidas', () => {
    for (const terminal of STATUS_TERMINAIS) {
      const saidas = transicoesValidas.filter(
        ([origem]) => origem === terminal,
      );
      expect(saidas).toHaveLength(0);
    }
  });
});
