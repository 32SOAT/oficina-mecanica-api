import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServicoReposicaoModule } from '../../ordens-de-servico/reposicao.module';
import { ESTOQUE_REPOSITORY } from '../application/ports/estoque.repository';
import { EstoqueTypeormEntity } from './typeorm/entity/estoque.typeorm.entity';
import { EstoqueTypeormRepository } from './typeorm/repository/estoque.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([EstoqueTypeormEntity]),
    OrdemServicoReposicaoModule,
  ],
  providers: [
    EstoqueTypeormRepository,
    { provide: ESTOQUE_REPOSITORY, useExisting: EstoqueTypeormRepository },
  ],
  exports: [ESTOQUE_REPOSITORY, OrdemServicoReposicaoModule],
})
export class EstoqueInfraModule {}
