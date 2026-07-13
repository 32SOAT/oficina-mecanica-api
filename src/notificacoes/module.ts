import { Module } from '@nestjs/common';
import { NotificacaoInfraModule } from './infrastructure/infra.module';

@Module({
  imports: [NotificacaoInfraModule],
  exports: [NotificacaoInfraModule],
})
export class NotificacaoModule {}
