import { Cpf, InvalidCpfError } from './cpf';

describe('Cpf', () => {
  describe('normalize', () => {
    it('should remove non-digit characters', () => {
      expect(Cpf.normalize('123.456.789-09')).toBe('12345678909');
    });

    it('should keep only digits from messy input', () => {
      expect(Cpf.normalize('a1b2c3d4e5f6g7h8i9j0')).toBe('1234567890');
    });

    it('should return empty string when input is empty', () => {
      expect(Cpf.normalize('')).toBe('');
    });
  });

  describe('isValid', () => {
    it('should return false for empty CPF', () => {
      expect(Cpf.isValid('')).toBe(false);
    });

    it('should return false for invalid length', () => {
      expect(Cpf.isValid('123')).toBe(false);
    });

    it('should return false for repeated digits', () => {
      expect(Cpf.isValid('11111111111')).toBe(false);
    });

    it('should return false for invalid check digits', () => {
      expect(Cpf.isValid('529.982.247-00')).toBe(false);
    });

    it('should return false when only one DV is wrong', () => {
      const base = '529.982.247-25';

      expect(Cpf.isValid(base)).toBe(true);
      expect(Cpf.isValid('529.982.247-20')).toBe(false);
    });

    it('should validate correct CPF with formatting', () => {
      expect(Cpf.isValid('529.982.247-25')).toBe(true);
    });

    it('should validate correct CPF without formatting', () => {
      expect(Cpf.isValid('52998224725')).toBe(true);
    });

    it('should differentiate close invalid CPF variations', () => {
      expect(Cpf.isValid('52998224725')).toBe(true);
      expect(Cpf.isValid('52998224726')).toBe(false);
    });
  });

  describe('create', () => {
    it('should create CPF instance when valid', () => {
      const cpf = Cpf.create('529.982.247-25');
      expect(cpf.toString()).toBe('52998224725');
    });

    it('should throw InvalidCpfError for invalid CPF', () => {
      expect(() => Cpf.create('111.111.111-11')).toThrow(InvalidCpfError);
    });

    it('should throw InvalidCpfError for malformed CPF', () => {
      expect(() => Cpf.create('123')).toThrow(InvalidCpfError);
    });

    it('should throw InvalidCpfError for CPF with wrong DV', () => {
      expect(() => Cpf.create('529.982.247-00')).toThrow(InvalidCpfError);
    });
  });

  describe('toString', () => {
    it('should always return normalized CPF', () => {
      const cpf = Cpf.create('529.982.247-25');
      expect(cpf.toString()).toBe('52998224725');
    });
  });
});
