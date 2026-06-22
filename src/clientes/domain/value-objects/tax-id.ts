const NON_DIGIT_CHARACTERS_REGEX = /\D/g;

export function normalizeTaxId(rawValue: string): string {
  const stringValue = String(rawValue);

  return stringValue.replace(NON_DIGIT_CHARACTERS_REGEX, '');
}

export function hasRepeatedDigits(digits: string): boolean {
  if (digits.length === 0) return false;

  const repeatedDigitPattern = /^([0-9])\1+$/;

  return repeatedDigitPattern.test(digits);
}
