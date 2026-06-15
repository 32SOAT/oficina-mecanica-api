import { Cnpj } from './value-objects/cnpj';
import { Cpf } from './value-objects/cpf';

export class InvalidClienteDocumentoError extends Error {
  constructor(message = 'CPF/CNPJ inválido.') {
    super(message);
    this.name = 'InvalidClienteDocumentoError';
  }
}

export class ClienteDocumento {
  private constructor(private readonly value: string) {}

  public static create(documento: string): ClienteDocumento {
    const normalized = Cpf.normalize(documento);
    if (!Cpf.isValid(normalized) && !Cnpj.isValid(normalized)) {
      throw new InvalidClienteDocumentoError();
    }
    return new ClienteDocumento(normalized);
  }

  public static normalize(documento: string): string {
    return Cpf.normalize(documento);
  }

  public equals(other: ClienteDocumento): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
