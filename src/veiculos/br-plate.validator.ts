export function isValidBrazilianPlate(plate: string): boolean {
  // Formato brasileiro: AAA-9999 (antigo) ou AAA9A99 (Mercosul)
  const normalized = plate.replaceAll(/[^A-Z0-9]/gi, '').toUpperCase();
  const regexOld = /^[A-Z]{3}[0-9]{4}$/; // AAA9999
  const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // AAA9A99
  return regexOld.test(normalized) || regexMercosul.test(normalized);
}

export function normalizePlate(plate: string): string {
  return plate.replaceAll(/[^A-Z0-9]/gi, '').toUpperCase();
}
