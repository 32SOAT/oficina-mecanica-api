import { ReservaPecaInvalidaError } from './errors/reserva-peca-invalida.error';
import {
  calcularReservaComprometida,
  quantidadeComprometidaParaEstorno,
  quantidadeParaBaixaEmExecucao,
} from './reserva-peca';

describe('reserva-peca', () => {
  it('calculates covered reservation', () => {
    expect(calcularReservaComprometida(10, 5)).toEqual({
      disponivelNoDiagnostico: true,
      precisaObservacaoCompra: false,
    });
  });

  it('calculates uncovered reservation', () => {
    expect(calcularReservaComprometida(2, 5)).toEqual({
      disponivelNoDiagnostico: false,
      precisaObservacaoCompra: true,
    });
  });

  it('rejects non-positive quantity', () => {
    expect(() => calcularReservaComprometida(10, 0)).toThrow(
      ReservaPecaInvalidaError,
    );
  });

  it('returns quantities for estorno and baixa', () => {
    expect(quantidadeComprometidaParaEstorno(3)).toBe(3);
    expect(quantidadeParaBaixaEmExecucao(true, 4)).toBe(4);
    expect(quantidadeParaBaixaEmExecucao(false, 4)).toBe(0);
  });
});
