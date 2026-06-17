import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServicoModule } from '../../ordens-de-servico/module';
import { ESTOQUE_REPOSITORY } from '../application/ports/estoque.repository';
import { ORDEM_SERVICO_REPOSICAO_PORT } from '../application/ports/ordem-servico-reposicao.port';
import { OrdemServicoReposicaoAdapter } from './adapters/ordem-servico-reposicao.adapter';
import { EstoqueTypeormEntity } from './typeorm/entity/estoque.typeorm.entity';
import { EstoqueTypeormRepository } from './typeorm/repository/estoque.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([EstoqueTypeormEntity]),
    OrdemServicoModule,
  ],
  providers: [
    EstoqueTypeormRepository,
    { provide: ESTOQUE_REPOSITORY, useClass: EstoqueTypeormRepository },
    OrdemServicoReposicaoAdapter,
    {
      provide: ORDEM_SERVICO_REPOSICAO_PORT,
      useClass: OrdemServicoReposicaoAdapter,
    },
  ],
  exports: [ESTOQUE_REPOSITORY, ORDEM_SERVICO_REPOSICAO_PORT],
})
export class EstoqueInfraModule {}
