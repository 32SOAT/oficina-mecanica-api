import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteModule } from '../../clientes/cliente.module';
import { VEICULO_REPOSITORY } from '../application/ports/veiculo.repository';
import { CLIENTE_LOOKUP_PORT } from '../application/ports/cliente-lookup.port';
import { ClienteLookupAdapter } from './adapters/cliente-lookup.adapter';
import { VeiculoTypeormEntity } from './typeorm/entity/veiculo.typeorm.entity';
import { VeiculoTypeormRepository } from './typeorm/repository/veiculo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VeiculoTypeormEntity]), ClienteModule],
  providers: [
    VeiculoTypeormRepository,
    { provide: VEICULO_REPOSITORY, useClass: VeiculoTypeormRepository },
    ClienteLookupAdapter,
    { provide: CLIENTE_LOOKUP_PORT, useClass: ClienteLookupAdapter },
  ],
  exports: [VEICULO_REPOSITORY, CLIENTE_LOOKUP_PORT],
})
export class VeiculoInfraModule {}
