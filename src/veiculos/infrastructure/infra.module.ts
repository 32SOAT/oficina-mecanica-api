import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteInfraModule } from '../../clientes/infrastructure/infra.module';
import { VEICULO_REPOSITORY } from '../application/ports/veiculo.repository';
import { VEICULO_TRANSACTIONAL_PORT } from '../application/ports/veiculo-transactional.port';
import { VeiculoTransactionalAdapter } from './transactional/veiculo-transactional.adapter';
import { VeiculoTypeormEntity } from './typeorm/entity/veiculo.typeorm.entity';
import { VeiculoTypeormRepository } from './typeorm/repository/veiculo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VeiculoTypeormEntity]), ClienteInfraModule],
  providers: [
    VeiculoTypeormRepository,
    VeiculoTransactionalAdapter,
    { provide: VEICULO_REPOSITORY, useExisting: VeiculoTypeormRepository },
    {
      provide: VEICULO_TRANSACTIONAL_PORT,
      useExisting: VeiculoTransactionalAdapter,
    },
  ],
  exports: [
    VEICULO_REPOSITORY,
    VEICULO_TRANSACTIONAL_PORT,
    ClienteInfraModule,
  ],
})
export class VeiculoInfraModule {}
