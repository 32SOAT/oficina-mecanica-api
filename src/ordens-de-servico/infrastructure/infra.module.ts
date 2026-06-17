import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteEntity } from '../../clientes/infra/typeorm/cliente.typeorm.entity';
import { VeiculoEntity } from '../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
import { ServicoEntity } from '../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { EstoqueEntity } from '../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { ORDEM_SERVICO_REPOSITORY } from '../application/ports/ordem-servico.repository';
import { HistoricoStatusOsEntity } from './typeorm/entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from './typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from './typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from './typeorm/entity/ordem-servico.typeorm.entity';
import { OrdemServicoTypeormRepository } from './typeorm/repository/ordem-servico.repository';
import { RelatorioTypeormRepository } from './typeorm/repository/relatorio.repository';
import { PersistirHistoricoListener } from './events/listeners/persistir-historico.listener';
import { NotificarListener } from './events/listeners/notificar.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdemServicoTypeormEntity,
      ItemOsServicoEntity,
      ItemOsEstoqueEntity,
      HistoricoStatusOsEntity,
      ClienteEntity,
      VeiculoEntity,
      ServicoEntity,
      EstoqueEntity,
    ]),
  ],
  providers: [
    OrdemServicoTypeormRepository,
    {
      provide: ORDEM_SERVICO_REPOSITORY,
      useClass: OrdemServicoTypeormRepository,
    },
    RelatorioTypeormRepository,
    PersistirHistoricoListener,
    NotificarListener,
  ],
  exports: [ORDEM_SERVICO_REPOSITORY, RelatorioTypeormRepository],
})
export class OrdemServicoInfraModule {}
