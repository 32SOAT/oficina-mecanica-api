import { isValidBrazilianPlate, normalizePlate } from './br-plate.validator';

describe('BR Plate Validator', () => {
  describe('isValidBrazilianPlate', () => {
    it('should validate correct plate formats', () => {
      expect(isValidBrazilianPlate('ABC1234')).toBe(true);
      expect(isValidBrazilianPlate('ABC-1234')).toBe(true);
      expect(isValidBrazilianPlate('abc1234')).toBe(true);
      expect(isValidBrazilianPlate('ABC 1234')).toBe(true);
    });

    it('should validate correct Mercosul format plates', () => {
      expect(isValidBrazilianPlate('ABC1D23')).toBe(true);
      expect(isValidBrazilianPlate('ABC-1D23')).toBe(true);
      expect(isValidBrazilianPlate('abc1d23')).toBe(true);
    });

    it('should reject invalid plate formats', () => {
      expect(isValidBrazilianPlate('AB1234')).toBe(false);
      expect(isValidBrazilianPlate('ABCD1234')).toBe(false);
      expect(isValidBrazilianPlate('ABC123')).toBe(false);
      expect(isValidBrazilianPlate('1234567')).toBe(false);
      expect(isValidBrazilianPlate('')).toBe(false);
    });
  });

  describe('normalizePlate', () => {
    it('should normalize plate to uppercase without special chars', () => {
      expect(normalizePlate('abc-1234')).toBe('ABC1234');
      expect(normalizePlate('ABC 1234')).toBe('ABC1234');
      expect(normalizePlate('aBc@1234')).toBe('ABC1234');
      expect(normalizePlate('ABC-1D23')).toBe('ABC1D23');
    });
  });
});