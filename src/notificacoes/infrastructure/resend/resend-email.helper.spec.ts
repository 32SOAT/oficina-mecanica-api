import { applyDevEmailRedirect, getResendErrorHint } from './resend-email.helper';

describe('resend-email.helper', () => {
  describe('applyDevEmailRedirect', () => {
    it('redireciona e preserva destinatário original no conteúdo', () => {
      const result = applyDevEmailRedirect(
        {
          to: 'cliente@example.com',
          subject: 'Assunto',
          text: 'Corpo',
          html: '<p>Corpo</p>',
        },
        'dev@outlook.com',
      );

      expect(result.to).toBe('dev@outlook.com');
      expect(result.subject).toContain('cliente@example.com');
      expect(result.text).toContain('cliente@example.com');
      expect(result.html).toContain('cliente@example.com');
    });

    it('não altera quando destino já é o redirect', () => {
      const input = {
        to: 'dev@outlook.com',
        subject: 'Assunto',
        text: 'Corpo',
      };

      expect(applyDevEmailRedirect(input, 'dev@outlook.com')).toEqual(input);
    });
  });

  describe('getResendErrorHint', () => {
    it('retorna dica para sandbox do Resend', () => {
      const hint = getResendErrorHint(
        new Error(
          'You can only send testing emails to your own email address',
        ),
      );
      expect(hint).toContain('sandbox');
      expect(hint).toContain('onboarding@resend.dev');
    });
  });
});
