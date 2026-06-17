import {
  AVISO_AGUARDAR_COMPRA_PECA,
  mergeObservacaoAvisoCompra,
} from './observacao-compra';

describe('mergeObservacaoAvisoCompra', () => {
  it('adds aviso when needed and observacao is empty', () => {
    expect(mergeObservacaoAvisoCompra(null, true)).toBe(
      AVISO_AGUARDAR_COMPRA_PECA,
    );
  });

  it('appends aviso to existing observacao', () => {
    expect(mergeObservacaoAvisoCompra('Cliente pediu urgência', true)).toContain(
      AVISO_AGUARDAR_COMPRA_PECA,
    );
  });

  it('keeps observacao when aviso already present', () => {
    const atual = `Nota\n\n${AVISO_AGUARDAR_COMPRA_PECA}`;
    expect(mergeObservacaoAvisoCompra(atual, true)).toBe(atual);
  });

  it('removes aviso when no longer needed', () => {
    const atual = `Nota\n\n${AVISO_AGUARDAR_COMPRA_PECA}`;
    expect(mergeObservacaoAvisoCompra(atual, false)).toBe('Nota');
  });

  it('returns null when observacao becomes empty', () => {
    expect(mergeObservacaoAvisoCompra(AVISO_AGUARDAR_COMPRA_PECA, false)).toBe(
      null,
    );
  });
});
