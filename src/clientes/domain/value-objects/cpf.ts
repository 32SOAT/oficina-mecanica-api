import { hasRepeatedDigits, normalizeTaxId } from './tax-id';

export class InvalidCpfError extends Error {
  constructor(message = 'CPF inválido.') {
    super(message);
    this.name = 'InvalidCpfError';
  }
}

export class Cpf {
  private constructor(private readonly value: string) {}

  public static normalize(raw: string): string {
    return normalizeTaxId(raw);
  }

  public static isValid(raw: string): boolean {
    const normalized = normalizeTaxId(raw);
    if (normalized.length !== 11 || hasRepeatedDigits(normalized)) {
      return false;
    }

    const base = normalized.slice(0, 9);
    const digits = normalized.slice(9);

    const firstVerifier = Cpf.calculateVerifier(base, 10);
    const firstDigit = firstVerifier % 11 < 2 ? 0 : 11 - (firstVerifier % 11);

    const secondVerifier = Cpf.calculateVerifier(base + String(firstDigit), 11);
    const secondDigit = secondVerifier % 11 < 2 ? 0 : 11 - (secondVerifier % 11);

    return digits === `${firstDigit}${secondDigit}`;
  }

  public static create(raw: string): Cpf {
    const normalized = normalizeTaxId(raw);
    if (!Cpf.isValid(normalized)) {
      throw new InvalidCpfError();
    }
    return new Cpf(normalized);
  }

  private static calculateVerifier(digits: string, factor: number): number {
    return digits
      .split('')
      .map((digit) => Number(digit))
      .reduce((sum, digit) => sum + digit * factor--, 0);
  }

  public toString(): string {
    return this.value;
  }
}
