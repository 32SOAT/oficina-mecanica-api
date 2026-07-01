import { ConfigService } from '@nestjs/config';
import { ResendNotificacaoAdapter } from './resend-notificacao.adapter';

const send = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send },
  })),
}));

describe('ResendNotificacaoAdapter', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue({
      apiKey: 're_test_key',
      from: 'onboarding@resend.dev',
      emailMecanicos: 'mecanicos@example.com',
      emailAdmin: 'admin@example.com',
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });
  });

  it('envia e-mail via Resend', async () => {
    const adapter = new ResendNotificacaoAdapter(configService);

    await adapter.enviarEmail({
      to: 'cliente@example.com',
      subject: 'Assunto',
      text: 'Corpo',
      html: '<p>Corpo</p>',
    });

    expect(send).toHaveBeenCalledWith({
      from: 'onboarding@resend.dev',
      to: 'cliente@example.com',
      subject: 'Assunto',
      text: 'Corpo',
      html: '<p>Corpo</p>',
    });
  });

  it('redireciona e-mail em dev quando RESEND_DEV_REDIRECT_TO está configurado', async () => {
    configService.getOrThrow = jest.fn().mockReturnValue({
      apiKey: 're_test_key',
      from: 'onboarding@resend.dev',
      emailMecanicos: 'mecanicos@example.com',
      emailAdmin: 'admin@example.com',
      devRedirectTo: 'dev@outlook.com',
    });

    const adapter = new ResendNotificacaoAdapter(configService);

    await adapter.enviarEmail({
      to: 'cliente@example.com',
      subject: 'Assunto',
      text: 'Corpo',
      html: '<p>Corpo</p>',
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'dev@outlook.com',
        subject: expect.stringContaining('cliente@example.com'),
      }),
    );
  });

  it('propaga erro retornado pelo Resend', async () => {
    send.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    const adapter = new ResendNotificacaoAdapter(configService);

    await expect(
      adapter.enviarEmail({
        to: 'cliente@example.com',
        subject: 'Assunto',
        text: 'Corpo',
      }),
    ).rejects.toThrow('Invalid API key');
  });
});
