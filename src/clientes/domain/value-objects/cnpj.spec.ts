import { Cnpj, InvalidCnpjError } from './cnpj';

describe('Cnpj', () => {
  describe('normalize', () => {
    it('should remove formatting characters', () => {
      expect(Cnpj.normalize('12.345.678/0001-95')).toBe('12345678000195');
    });

    it('should extract only digits from noisy input', () => {
      expect(Cnpj.normalize('a1b2c3.4d5/6e7f8g0001-95')).toBe('12345678000195');
    });

    it('should return empty string when input is empty', () => {
      expect(Cnpj.normalize('')).toBe('');
    });
  });

  describe('isValid', () => {
    it('should return false for empty CNPJ', () => {
      expect(Cnpj.isValid('')).toBe(false);
    });

    it('should return false for invalid length', () => {
      expect(Cnpj.isValid('123')).toBe(false);
    });

    it('should return false for repeated digits', () => {
      expect(Cnpj.isValid('11111111111111')).toBe(false);
    });

    it('should return false for invalid check digits', () => {
      expect(Cnpj.isValid('04.252.011/0001-99')).toBe(false);
    });

    it('should validate correct formatted CNPJ', () => {
      expect(Cnpj.isValid('04.252.011/0001-10')).toBe(true);
    });

    it('should validate correct unformatted CNPJ', () => {
      expect(Cnpj.isValid('04252011000110')).toBe(true);
    });

    it('should reject near-valid CNPJ with wrong DV', () => {
      expect(Cnpj.isValid('04252011000111')).toBe(false);
    });
  });

  describe('create', () => {
    it('should create CNPJ instance when valid', () => {
      const cnpj = Cnpj.create('04.252.011/0001-10');
      expect(cnpj.toString()).toBe('04252011000110');
    });

    it('should throw InvalidCnpjError for invalid CNPJ', () => {
      expect(() => Cnpj.create('111.111.111/1111-11')).toThrow(
        InvalidCnpjError,
      );
    });

    it('should throw InvalidCnpjError for malformed input', () => {
      expect(() => Cnpj.create('123')).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidCnpjError for wrong DV', () => {
      expect(() => Cnpj.create('04.252.011/0001-99')).toThrow(InvalidCnpjError);
    });
  });

  describe('toString', () => {
    it('should return normalized value always', () => {
      const cnpj = Cnpj.create('04.252.011/0001-10');
      expect(cnpj.toString()).toHaveLength(14);
      expect(cnpj.toString()).toBe('04252011000110');
    });
  });
});
