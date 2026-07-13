import { registerAs } from '@nestjs/config';

export interface ResendConfig {
  apiKey: string;
  from: string;
  emailMecanicos: string;
  emailAdmin: string;
  /** Redireciona todos os e-mails para essa caixa pois apenas o e-mail da conta pode ser usado para testes. */
  devRedirectTo?: string;
}

export function resolveDevRedirectTo(redirectTo?: string): string | undefined {
  return redirectTo?.trim() || undefined;
}

export const resendConfig = registerAs('resend', (): ResendConfig => {
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

  return {
    apiKey: process.env.RESEND_API_KEY!,
    from,
    emailMecanicos: process.env.NOTIFICACAO_EMAIL_MECANICOS!,
    emailAdmin: process.env.NOTIFICACAO_EMAIL_ADMIN!,
    devRedirectTo: resolveDevRedirectTo(process.env.RESEND_DEV_REDIRECT_TO),
  };
});