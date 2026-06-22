import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from './cliente-documento';

describe('ClienteDocumento (Value Object)', () => {
  const validCpf = '28857786013';
  const validCnpj = '11222333000181';

  it('should create a valid CPF document', () => {
    const doc = ClienteDocumento.create(validCpf);

    expect(doc.toString()).toBe(validCpf);
  });

  it('should create a valid CNPJ document', () => {
    const doc = ClienteDocumento.create(validCnpj);

    expect(doc.toString()).toBe(validCnpj);
  });

  it('should normalize CPF with punctuation', () => {
    const doc = ClienteDocumento.create('288.577.860-13');

    expect(doc.toString()).toBe(validCpf);
  });

  it('should normalize CNPJ with punctuation', () => {
    const doc = ClienteDocumento.create('11.222.333/0001-81');

    expect(doc.toString()).toBe(validCnpj);
  });

  it('should throw error for invalid document', () => {
    expect(() => ClienteDocumento.create('12345678900')).toThrow(
      InvalidClienteDocumentoError,
    );

    expect(() => ClienteDocumento.create('12345678900')).toThrow(
      'CPF/CNPJ inválido.',
    );
  });

  it('should normalize using static method', () => {
    expect(ClienteDocumento.normalize('288.577.860-13')).toBe(validCpf);
  });

  it('should compare equal documents', () => {
    const doc1 = ClienteDocumento.create(validCpf);
    const doc2 = ClienteDocumento.create(validCpf);

    expect(doc1.equals(doc2)).toBe(true);
  });

  it('should compare different documents', () => {
    const doc1 = ClienteDocumento.create(validCpf);
    const doc2 = ClienteDocumento.create(validCnpj);

    expect(doc1.equals(doc2)).toBe(false);
  });
});
