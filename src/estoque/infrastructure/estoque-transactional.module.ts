import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ESTOQUE_TRANSACTIONAL_PORT } from '../application/ports/estoque-transactional.port';
import { EstoqueTransactionalAdapter } from './transactional/estoque-transactional.adapter';
import { EstoqueTypeormEntity } from './typeorm/entity/estoque.typeorm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstoqueTypeormEntity])],
  providers: [
    EstoqueTransactionalAdapter,
    {
      provide: ESTOQUE_TRANSACTIONAL_PORT,
      useExisting: EstoqueTransactionalAdapter,
    },
  ],
  exports: [ESTOQUE_TRANSACTIONAL_PORT],
})
export class EstoqueTransactionalModule {}
