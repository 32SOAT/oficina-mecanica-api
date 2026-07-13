import { Module } from '@nestjs/common';
import { NOTIFICACAO_PORT } from '../application/ports/notificacao.port';
import { ResendNotificacaoAdapter } from './resend/resend-notificacao.adapter';

@Module({
  providers: [
    ResendNotificacaoAdapter,
    {
      provide: NOTIFICACAO_PORT,
      useExisting: ResendNotificacaoAdapter,
    },
  ],
  exports: [NOTIFICACAO_PORT],
})
export class NotificacaoInfraModule {}
