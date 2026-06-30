import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteInfraModule } from '../../clientes/infrastructure/infra.module';
import { VEICULO_LOOKUP_PORT } from '../application/ports/veiculo-lookup.port';
import { VEICULO_REPOSITORY } from '../application/ports/veiculo.repository';
import { VEICULO_TRANSACTIONAL_PORT } from '../application/ports/veiculo-transactional.port';
import { VeiculoLookupAdapter } from './lookup/veiculo-lookup.adapter';
import { VeiculoTransactionalAdapter } from './transactional/veiculo-transactional.adapter';
import { VeiculoTypeormEntity } from './typeorm/entity/veiculo.typeorm.entity';
import { VeiculoTypeormRepository } from './typeorm/repository/veiculo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VeiculoTypeormEntity]), ClienteInfraModule],
  providers: [
    VeiculoTypeormRepository,
    VeiculoLookupAdapter,
    VeiculoTransactionalAdapter,
    { provide: VEICULO_REPOSITORY, useExisting: VeiculoTypeormRepository },
    {
      provide: VEICULO_LOOKUP_PORT,
      useExisting: VeiculoLookupAdapter,
    },
    {
      provide: VEICULO_TRANSACTIONAL_PORT,
      useExisting: VeiculoTransactionalAdapter,
    },
  ],
  exports: [
    VEICULO_REPOSITORY,
    VEICULO_LOOKUP_PORT,
    VEICULO_TRANSACTIONAL_PORT,
    ClienteInfraModule,
  ],
})
export class VeiculoInfraModule {}
