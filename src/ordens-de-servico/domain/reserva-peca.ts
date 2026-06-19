import { ReservaPecaInvalidaError } from './errors/reserva-peca-invalida.error';

export type ReservaPecaSnapshot = {
  disponivelNoDiagnostico: boolean;
  precisaObservacaoCompra: boolean;
};

export function calcularReservaComprometida(
  disponivelAntesReserva: number,
  quantidadeSolicitada: number,
): ReservaPecaSnapshot {
  if (quantidadeSolicitada <= 0) {
    throw new ReservaPecaInvalidaError('Quantidade deve ser maior que zero.');
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
