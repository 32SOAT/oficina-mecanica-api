import { StatusOrdemServico } from '../status-ordem-servico.enum';

export class TransicaoInvalidaError extends Error {
  constructor(
    public readonly de: StatusOrdemServico | null,
    public readonly para: StatusOrdemServico,
  ) {
    super(
      `Transição inválida: não é possível ir de "${de ?? 'nenhum'}" para "${para}".`,
    );
    this.name = 'TransicaoInvalidaError';
  }
}
