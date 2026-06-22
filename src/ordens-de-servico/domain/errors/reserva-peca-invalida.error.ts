export class ReservaPecaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservaPecaInvalidaError';
  }
}
