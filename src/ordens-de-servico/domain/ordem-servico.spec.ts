import { TransicaoInvalidaError } from './errors/transicao-invalida.error';
import {
  avancarStatusOrdemServico,
  calcularValorTotalOrdemServico,
  todasPecasDisponiveis,
} from './ordem-servico';
import { StatusOrdemServico as S } from './status-ordem-servico.enum';

describe('avancarStatusOrdemServico', () => {
  it('retorna anterior e novo em transição válida', () => {
    const { anterior, novo } = avancarStatusOrdemServico(
      S.Recebida,
      S.EmDiagnostico,
    );
    expect(anterior).toBe(S.Recebida);
    expect(novo).toBe(S.EmDiagnostico);
  });

  it('lança TransicaoInvalidaError em transição inválida', () => {
    expect(() => avancarStatusOrdemServico(S.Recebida, S.Entregue)).toThrow(
      TransicaoInvalidaError,
    );
  });
});

describe('calcularValorTotalOrdemServico', () => {
  it('soma serviços e peças', () => {
    const total = calcularValorTotalOrdemServico(
      [{ precoAplicado: 100 }],
      [{ precoAplicado: 50, quantidade: 2, disponivelNoDiagnostico: true }],
    );
    expect(total).toBe(200);
  });
});

describe('todasPecasDisponiveis', () => {
  it('retorna true quando todas marcadas', () => {
    expect(
      todasPecasDisponiveis([
        { precoAplicado: 0, quantidade: 1, disponivelNoDiagnostico: true },
      ]),
    ).toBe(true);
  });

  it('retorna true sem peças', () => {
    expect(todasPecasDisponiveis([])).toBe(true);
  });

  it('retorna false quando alguma indisponível', () => {
    expect(
      todasPecasDisponiveis([
        { precoAplicado: 0, quantidade: 1, disponivelNoDiagnostico: false },
      ]),
    ).toBe(false);
  });
});
