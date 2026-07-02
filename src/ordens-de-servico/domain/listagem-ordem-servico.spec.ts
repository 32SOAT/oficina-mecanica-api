import { StatusOrdemServico as S } from './status-ordem-servico.enum';
import {
  PRIORIDADE_LISTAGEM_FALLBACK,
  PRIORIDADE_STATUS_LISTAGEM,
  STATUS_EXCLUIDOS_LISTAGEM_PADRAO,
  prioridadeStatusListagem,
} from './listagem-ordem-servico';

describe('listagem-ordem-servico', () => {
  it('exclui finalizadas, entregues e canceladas da listagem padrão', () => {
    expect(STATUS_EXCLUIDOS_LISTAGEM_PADRAO).toEqual([
      S.Finalizada,
      S.Entregue,
      S.Cancelada,
    ]);
  });

  it('ordena status operacionais conforme fila da oficina', () => {
    expect(PRIORIDADE_STATUS_LISTAGEM).toEqual([
      S.EmExecucao,
      S.AguardandoServico,
      S.AguardandoPecasInsumos,
      S.AguardandoAprovacao,
      S.EmDiagnostico,
      S.Recebida,
    ]);

    for (let i = 0; i < PRIORIDADE_STATUS_LISTAGEM.length - 1; i += 1) {
      expect(
        prioridadeStatusListagem(PRIORIDADE_STATUS_LISTAGEM[i]),
      ).toBeLessThan(
        prioridadeStatusListagem(PRIORIDADE_STATUS_LISTAGEM[i + 1]),
      );
    }
  });

  it('coloca demais status após os prioritários', () => {
    expect(PRIORIDADE_LISTAGEM_FALLBACK).toBe(99);
    expect(prioridadeStatusListagem(S.Aprovada)).toBe(
      PRIORIDADE_LISTAGEM_FALLBACK,
    );
    expect(prioridadeStatusListagem(S.Recebida)).toBeLessThan(
      prioridadeStatusListagem(S.Aprovada),
    );
  });
});
