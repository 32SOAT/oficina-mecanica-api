export class EstoqueOperacaoInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EstoqueOperacaoInvalidaError';
  }
}
