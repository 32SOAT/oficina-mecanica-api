import { EnviarEmailInput } from '../../application/dto/enviar-email.input';

export function applyDevEmailRedirect(
  input: EnviarEmailInput,
  redirectTo: string,
): EnviarEmailInput {
  if (input.to === redirectTo) {
    return input;
  }

  const prefix = `[DEV → ${input.to}] `;

  return {
    to: redirectTo,
    subject: `${prefix}${input.subject}`,
    text: `[Ambiente de desenvolvimento — destinatário original: ${input.to}]\n\n${input.text}`,
    html: input.html
      ? `<p><em>Ambiente de desenvolvimento — destinatário original: ${input.to}</em></p>${input.html}`
      : undefined,
  };
}

export function getResendErrorHint(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('only send testing emails to your own email')) {
    return (
      'Resend em modo sandbox (onboarding@resend.dev) só envia para o e-mail da conta. ' +
      'Verifique o e-mail de destino e tente novamente.'
    );
  }

  return undefined;
}
