import { normalizeTaxId, hasRepeatedDigits } from './tax-id';

describe('normalizeTaxId', () => {
  it('should remove all non-digit characters', () => {
    expect(normalizeTaxId('123.456.789-00')).toBe('12345678900');
  });

  it('should keep only numbers from mixed input', () => {
    expect(normalizeTaxId('abc123def')).toBe('123');
  });

  it('should handle spaces correctly', () => {
    expect(normalizeTaxId(' 12 34 ')).toBe('1234');
  });

  it('should return empty string when input has no digits', () => {
    expect(normalizeTaxId('abc')).toBe('');
  });

  it('should handle empty input', () => {
    expect(normalizeTaxId('')).toBe('');
  });
});

describe('hasRepeatedDigits', () => {
  it('should return true when all digits are the same', () => {
    expect(hasRepeatedDigits('111111')).toBe(true);
  });

  it('should return true for single digit', () => {
    expect(hasRepeatedDigits('1')).toBe(false);
  });

  it('should return true for long repeated digits', () => {
    expect(hasRepeatedDigits('00000000000')).toBe(true);
  });

  it('should return false when digits are different', () => {
    expect(hasRepeatedDigits('123456')).toBe(false);
  });

  it('should return false when only last digit differs', () => {
    expect(hasRepeatedDigits('111112')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasRepeatedDigits('')).toBe(false);
  });
});
