import { resolveDevRedirectTo } from './resend.config';

describe('resolveDevRedirectTo', () => {
  it('retorna e-mail quando RESEND_DEV_REDIRECT_TO está definido', () => {
    expect(resolveDevRedirectTo('dev@outlook.com')).toBe('dev@outlook.com');
  });

  it('funciona com qualquer remetente (domínio verificado ou sandbox)', () => {
    expect(resolveDevRedirectTo('  fiap-api-pos@outlook.com  ')).toBe(
      'fiap-api-pos@outlook.com',
    );
  });

  it('retorna undefined quando não configurado', () => {
    expect(resolveDevRedirectTo()).toBeUndefined();
    expect(resolveDevRedirectTo('')).toBeUndefined();
  });
});
