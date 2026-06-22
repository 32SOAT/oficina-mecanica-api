export class InvalidPlacaError extends Error {
  constructor(message = 'Placa inválida.') {
    super(message);
    this.name = 'InvalidPlacaError';
  }
}

export class Placa {
  private constructor(private readonly value: string) {}

  public static normalize(plate: string): string {
    return plate.replaceAll(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  public static isValid(plate: string): boolean {
    const normalized = Placa.normalize(plate);
    const regexOld = /^[A-Z]{3}\d{4}$/;
    const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    return regexOld.test(normalized) || regexMercosul.test(normalized);
  }

  public static create(plate: string): Placa {
    const normalized = Placa.normalize(plate);
    if (!Placa.isValid(normalized)) {
      throw new InvalidPlacaError();
    }
    return new Placa(normalized);
  }

  public toString(): string {
    return this.value;
  }
}
