import { hasRepeatedDigits, normalizeTaxId } from './tax-id';

export class InvalidCnpjError extends Error {
  constructor(message = 'CNPJ inválido.') {
    super(message);
    this.name = 'InvalidCnpjError';
  }
}

export class Cnpj {
  private constructor(private readonly value: string) {}

  public static normalize(raw: string): string {
    return normalizeTaxId(raw);
  }

  public static isValid(raw: string): boolean {
    const normalized = normalizeTaxId(raw);
    if (normalized.length !== 14 || hasRepeatedDigits(normalized)) {
      return false;
    }

    const base = normalized.slice(0, 12);
    const digits = normalized.slice(12);

    const firstFactors = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const firstVerifier = Cnpj.calculateVerifier(base, firstFactors);
    const firstDigit = firstVerifier % 11 < 2 ? 0 : 11 - (firstVerifier % 11);

    const secondFactors = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondVerifier = Cnpj.calculateVerifier(base + String(firstDigit), secondFactors);
    const secondDigit = secondVerifier % 11 < 2 ? 0 : 11 - (secondVerifier % 11);

    return digits === `${firstDigit}${secondDigit}`;
  }

  public static create(raw: string): Cnpj {
    const normalized = normalizeTaxId(raw);
    if (!Cnpj.isValid(normalized)) {
      throw new InvalidCnpjError();
    }
    return new Cnpj(normalized);
  }

  private static calculateVerifier(digits: string, factors: number[]): number {
    return digits
      .split('')
      .map((digit) => Number(digit))
      .reduce((sum, digit, index) => sum + digit * factors[index], 0);
  }

  public toString(): string {
    return this.value;
  }
}
