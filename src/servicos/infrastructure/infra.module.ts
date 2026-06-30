import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SERVICO_LOOKUP_PORT } from '../application/ports/servico-lookup.port';
import { SERVICO_REPOSITORY } from '../application/ports/servico.repository';
import { SERVICO_TRANSACTIONAL_PORT } from '../application/ports/servico-transactional.port';
import { ServicoLookupAdapter } from './lookup/servico-lookup.adapter';
import { ServicoTransactionalAdapter } from './transactional/servico-transactional.adapter';
import { ServicoTypeormEntity } from './typeorm/entity/servico.typeorm.entity';
import { ServicoTypeormRepository } from './typeorm/repository/servico.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServicoTypeormEntity])],
  providers: [
    ServicoTypeormRepository,
    ServicoLookupAdapter,
    ServicoTransactionalAdapter,
    { provide: SERVICO_REPOSITORY, useExisting: ServicoTypeormRepository },
    {
      provide: SERVICO_LOOKUP_PORT,
      useExisting: ServicoLookupAdapter,
    },
    {
      provide: SERVICO_TRANSACTIONAL_PORT,
      useExisting: ServicoTransactionalAdapter,
    },
  ],
  exports: [SERVICO_REPOSITORY, SERVICO_LOOKUP_PORT, SERVICO_TRANSACTIONAL_PORT],
})
export class ServicoInfraModule {}
