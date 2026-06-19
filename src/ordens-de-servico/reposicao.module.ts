import { Module } from '@nestjs/common';
import { ORDEM_SERVICO_REPOSICAO_PORT } from '../estoque/application/ports/ordem-servico-reposicao.port';
import { TentarLiberarOsAposReposicaoEstoqueUseCase } from './application/use-cases/tentar-liberar-os-apos-reposicao-estoque.use-case';
import { OrdemServicoReposicaoAdapter } from './infrastructure/adapters/ordem-servico-reposicao.adapter';
import { OrdemServicoInfraModule } from './infrastructure/infra.module';

@Module({
  imports: [OrdemServicoInfraModule],
  providers: [
    TentarLiberarOsAposReposicaoEstoqueUseCase,
    OrdemServicoReposicaoAdapter,
    {
      provide: ORDEM_SERVICO_REPOSICAO_PORT,
      useExisting: OrdemServicoReposicaoAdapter,
    },
  ],
  exports: [ORDEM_SERVICO_REPOSICAO_PORT],
})
export class OrdemServicoReposicaoModule {}
