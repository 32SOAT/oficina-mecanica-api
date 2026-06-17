import { Placa } from './placa';

describe('Placa', () => {
  describe('isValid', () => {
    it('validates old and Mercosul formats', () => {
      expect(Placa.isValid('ABC1234')).toBe(true);
      expect(Placa.isValid('ABC-1234')).toBe(true);
      expect(Placa.isValid('ABC1D23')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(Placa.isValid('AB1234')).toBe(false);
      expect(Placa.isValid('')).toBe(false);
    });
  });

  describe('normalize', () => {
    it('normalizes plate', () => {
      expect(Placa.normalize('abc-1234')).toBe('ABC1234');
      expect(Placa.normalize('ABC-1D23')).toBe('ABC1D23');
    });
  });
});
