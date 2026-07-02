import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteInfraModule } from '../../clientes/infrastructure/infra.module';
import { EstoqueTransactionalModule } from '../../estoque/infrastructure/estoque-transactional.module';
import { NotificacaoInfraModule } from '../../notificacoes/infrastructure/infra.module';
import { ServicoInfraModule } from '../../servicos/infrastructure/infra.module';
import { VeiculoInfraModule } from '../../veiculos/infrastructure/infra.module';
import { ORDEM_SERVICO_EVENTS_PORT } from '../application/ports/ordem-servico-events.port';
import { ORDEM_SERVICO_QUERY_PORT } from '../application/ports/ordem-servico-query.port';
import { ORDEM_SERVICO_TRANSACTION_PORT } from '../application/ports/ordem-servico-transaction.port';
import { RELATORIO_REPOSITORY } from '../application/ports/relatorio.repository';
import { OrdemServicoEventsAdapter } from './events/ordem-servico-events.adapter';
import { NotificarListener } from './events/listeners/notificar.listener';
import { PersistirHistoricoListener } from './events/listeners/persistir-historico.listener';
import { OrdemServicoTypeormTransaction } from './persistence/ordem-servico.typeorm-transaction';
import { HistoricoStatusOsEntity } from './typeorm/entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from './typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from './typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from './typeorm/entity/ordem-servico.typeorm.entity';
import { OrdemServicoTypeormRepository } from './typeorm/repository/ordem-servico.repository';
import { RelatorioTypeormRepository } from './typeorm/repository/relatorio.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdemServicoTypeormEntity,
      ItemOsServicoEntity,
      ItemOsEstoqueEntity,
      HistoricoStatusOsEntity,
    ]),
    ClienteInfraModule,
    VeiculoInfraModule,
    ServicoInfraModule,
    EstoqueTransactionalModule,
    NotificacaoInfraModule,
  ],
  providers: [
    OrdemServicoTypeormRepository,
    OrdemServicoTypeormTransaction,
    OrdemServicoEventsAdapter,
    {
      provide: ORDEM_SERVICO_QUERY_PORT,
      useExisting: OrdemServicoTypeormRepository,
    },
    {
      provide: ORDEM_SERVICO_TRANSACTION_PORT,
      useExisting: OrdemServicoTypeormTransaction,
    },
    {
      provide: ORDEM_SERVICO_EVENTS_PORT,
      useExisting: OrdemServicoEventsAdapter,
    },
    RelatorioTypeormRepository,
    {
      provide: RELATORIO_REPOSITORY,
      useExisting: RelatorioTypeormRepository,
    },
    PersistirHistoricoListener,
    NotificarListener,
  ],
  exports: [
    ORDEM_SERVICO_QUERY_PORT,
    ORDEM_SERVICO_TRANSACTION_PORT,
    ORDEM_SERVICO_EVENTS_PORT,
    RELATORIO_REPOSITORY,
  ],
})
export class OrdemServicoInfraModule {}
