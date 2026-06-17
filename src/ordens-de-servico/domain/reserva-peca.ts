import { EstoqueOperacaoInvalidaError } from '../../estoque/domain/errors/estoque-operacao-invalida.error';

export type ReservaPecaSnapshot = {
  disponivelNoDiagnostico: boolean;
  precisaObservacaoCompra: boolean;
};

export function calcularReservaComprometida(
  disponivelAntesReserva: number,
  quantidadeSolicitada: number,
): ReservaPecaSnapshot {
  if (quantidadeSolicitada <= 0) {
    throw new EstoqueOperacaoInvalidaError('Quantidade deve ser maior que zero.');
  }
  const cobertoNoMomento = disponivelAntesReserva >= quantidadeSolicitada;
  return {
    disponivelNoDiagnostico: cobertoNoMomento,
    precisaObservacaoCompra: !cobertoNoMomento,
  };
}

export function quantidadeComprometidaParaEstorno(quantidade: number): number {
  return quantidade;
}

export function quantidadeParaBaixaEmExecucao(
  disponivelNoDiagnostico: boolean,
  quantidade: number,
): number {
  return disponivelNoDiagnostico ? quantidade : 0;
}
