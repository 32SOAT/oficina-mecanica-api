import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClienteEntity } from '../clientes/cliente.entity';
import { VeiculoEntity } from '../veiculos/veiculo.entity';
import { ServicoEntity } from '../servicos/servico.entity';
import { EstoqueEntity } from '../estoque/estoque.entity';
import { QueryingModule } from '../querying/querying.module';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { OrdemServicoService } from './ordem-servico.service';
import { PersistirHistoricoListener } from './events/listeners/persistir-historico.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdemServicoEntity,
      ItemOsServicoEntity,
      ItemOsEstoqueEntity,
      HistoricoStatusOsEntity,
      ClienteEntity,
      VeiculoEntity,
      ServicoEntity,
      EstoqueEntity,
    ]),
    EventEmitterModule.forRoot(),
    QueryingModule,
  ],
  controllers: [],
  providers: [OrdemServicoService, PersistirHistoricoListener],
  exports: [OrdemServicoService],
})
export class OrdemServicoModule {}
