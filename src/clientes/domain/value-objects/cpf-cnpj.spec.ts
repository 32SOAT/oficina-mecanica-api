import { Cnpj, InvalidCnpjError } from './domain/value-objects/cnpj';
import { Cpf, InvalidCpfError } from './domain/value-objects/cpf';

describe('CPF value object', () => {
  it('normalizes a formatted CPF', () => {
    expect(Cpf.normalize('390.533.447-05')).toBe('39053344705');
  });

  it('validates a correct CPF', () => {
    expect(Cpf.isValid('390.533.447-05')).toBe(true);
  });

  it('rejects an invalid CPF', () => {
    expect(() => Cpf.create('111.111.111-11')).toThrow(InvalidCpfError);
  });
});

describe('CNPJ value object', () => {
  it('normalizes a formatted CNPJ', () => {
    expect(Cnpj.normalize('12.345.678/0001-90')).toBe('12345678000190');
  });

  it('validates a correct CNPJ', () => {
    expect(Cnpj.isValid('12345678000195')).toBe(true);
  });

  it('rejects an invalid CNPJ', () => {
    expect(() => Cnpj.create('11.111.111/1111-11')).toThrow(InvalidCnpjError);
  });
});
