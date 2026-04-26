import { fake as fakeCnpj } from 'validation-br/dist/cnpj';
import { fake as fakeCpf } from 'validation-br/dist/cpf';
import { isValidBrazilianTaxId, normalizeTaxId } from './br-document.validator';

describe('br-document.validator', () => {
  describe('normalizeTaxId', () => {
    it('normalizes a formatted CNPJ', () => {
      expect(normalizeTaxId('12.345.678/0001-90')).toBe('12345678000190');
    });

    it('normalizes a CPF value', () => {
      const cpf = fakeCpf(false);
      expect(normalizeTaxId(cpf)).toBe(cpf);
    });
  });

  describe('isValidBrazilianTaxId', () => {
    it('returns true for a valid CPF', () => {
      expect(isValidBrazilianTaxId(fakeCpf(false))).toBe(true);
    });

    it('returns true for a valid CNPJ', () => {
      expect(
        isValidBrazilianTaxId(
          fakeCnpj({ alphanumeric: false, withMask: false }),
        ),
      ).toBe(true);
    });

    it('returns false for invalid length', () => {
      expect(isValidBrazilianTaxId('123')).toBe(false);
    });

    it('returns false for invalid checksum', () => {
      expect(isValidBrazilianTaxId('11111111111')).toBe(false);
    });
  });
});
