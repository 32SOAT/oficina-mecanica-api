import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendConfig } from '../../../config/env/resend.config';
import { EnviarEmailInput } from '../../application/dto/enviar-email.input';
import { NotificacaoPort } from '../../application/ports/notificacao.port';
import { applyDevEmailRedirect } from './resend-email.helper';

@Injectable()
export class ResendNotificacaoAdapter implements NotificacaoPort {
  private readonly logger = new Logger(ResendNotificacaoAdapter.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly devRedirectTo?: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.getOrThrow<ResendConfig>('resend');
    this.from = config.from;
    this.devRedirectTo = config.devRedirectTo;
    this.resend = new Resend(config.apiKey);
  }

  async enviarEmail(input: EnviarEmailInput): Promise<void> {
    const payload = this.devRedirectTo
      ? applyDevEmailRedirect(input, this.devRedirectTo)
      : input;

    if (this.devRedirectTo && payload.to !== input.to) {
      this.logger.debug(
        `Redirecionando e-mail de ${input.to} para ${payload.to} (dev).`,
      );
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (error) {
      throw new Error(error.message);
    }

    this.logger.log(
      `E-mail enviado para ${payload.to}${payload.to !== input.to ? ` (original: ${input.to})` : ''}: ${input.subject}`,
    );
  }
}
