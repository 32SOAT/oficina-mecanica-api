const onlyDigitsRegex = /\D/g;

export function normalizeTaxId(raw: string): string {
  return String(raw).replace(onlyDigitsRegex, '');
}

export function hasRepeatedDigits(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}
