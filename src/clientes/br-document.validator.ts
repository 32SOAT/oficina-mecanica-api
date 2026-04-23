import { isCPF, isCNPJ } from 'validation-br';
import { normalize as normalizeCpf } from 'validation-br/dist/cpf';
import { normalize as normalizeCnpj } from 'validation-br/dist/cnpj';

export function normalizeTaxId(raw: string): string {
  try {
    const cnpjStripped = normalizeCnpj(raw);
    if (cnpjStripped.length === 14) {
      return cnpjStripped;
    }
  } catch {
    void 0;
  }
  try {
    return normalizeCpf(raw);
  } catch {
    return String(raw).replace(/\D/g, '');
  }
}

export function isValidBrazilianTaxId(raw: string): boolean {
  return isCPF(raw) || isCNPJ(raw);
}
