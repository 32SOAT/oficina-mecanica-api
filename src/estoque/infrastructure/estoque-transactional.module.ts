import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ESTOQUE_LOOKUP_PORT } from '../application/ports/estoque-lookup.port';
import { ESTOQUE_TRANSACTIONAL_PORT } from '../application/ports/estoque-transactional.port';
import { EstoqueLookupAdapter } from './lookup/estoque-lookup.adapter';
import { EstoqueTransactionalAdapter } from './transactional/estoque-transactional.adapter';
import { EstoqueTypeormEntity } from './typeorm/entity/estoque.typeorm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstoqueTypeormEntity])],
  providers: [
    EstoqueLookupAdapter,
    EstoqueTransactionalAdapter,
    {
      provide: ESTOQUE_LOOKUP_PORT,
      useExisting: EstoqueLookupAdapter,
    },
    {
      provide: ESTOQUE_TRANSACTIONAL_PORT,
      useExisting: EstoqueTransactionalAdapter,
    },
  ],
  exports: [ESTOQUE_LOOKUP_PORT, ESTOQUE_TRANSACTIONAL_PORT],
})
export class EstoqueTransactionalModule {}
