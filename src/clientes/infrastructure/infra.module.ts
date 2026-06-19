import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CLIENTE_REPOSITORY,
} from '../application/ports/cliente.repository';
import { CLIENTE_LOOKUP_PORT } from '../application/ports/cliente-lookup.port';
import { CLIENTE_TRANSACTIONAL_PORT } from '../application/ports/cliente-transactional.port';
import { ClienteLookupAdapter } from './lookup/cliente-lookup.adapter';
import { ClienteTransactionalAdapter } from './transactional/cliente-transactional.adapter';
import { ClienteTypeormEntity } from './typeorm/entity/cliente.typeorm.entity';
import { ClienteTypeormRepository } from './typeorm/repository/cliente.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteTypeormEntity])],
  providers: [
    ClienteTypeormRepository,
    ClienteTransactionalAdapter,
    ClienteLookupAdapter,
    {
      provide: CLIENTE_REPOSITORY,
      useExisting: ClienteTypeormRepository,
    },
    {
      provide: CLIENTE_LOOKUP_PORT,
      useExisting: ClienteLookupAdapter,
    },
    {
      provide: CLIENTE_TRANSACTIONAL_PORT,
      useExisting: ClienteTransactionalAdapter,
    },
  ],
  exports: [CLIENTE_REPOSITORY, CLIENTE_LOOKUP_PORT, CLIENTE_TRANSACTIONAL_PORT],
})
export class ClienteInfraModule {}
