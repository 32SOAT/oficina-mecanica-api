export class InvalidPrecoMaoDeObraError extends Error {
  constructor(message = 'Preço não pode ser negativo.') {
    super(message);
    this.name = 'InvalidPrecoMaoDeObraError';
  }
}
