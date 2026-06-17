import { Module } from '@nestjs/common';
import { CreateEstoqueUseCase } from './application/use-cases/create-estoque.use-case';
import { ExecutarOperacaoEstoqueUseCase } from './application/use-cases/executar-operacao-estoque.use-case';
import { FindAllEstoquesUseCase } from './application/use-cases/find-all-estoques.use-case';
import { FindEstoqueByIdUseCase } from './application/use-cases/find-estoque-by-id.use-case';
import { RegistrarReposicaoEstoqueUseCase } from './application/use-cases/registrar-reposicao-estoque.use-case';
import { RemoveEstoqueUseCase } from './application/use-cases/remove-estoque.use-case';
import { UpdateEstoqueUseCase } from './application/use-cases/update-estoque.use-case';
import { EstoqueInfraModule } from './infrastructure/infra.module';
import { EstoqueController } from './presentation/controllers/estoque.controller';

@Module({
  imports: [EstoqueInfraModule],
  controllers: [EstoqueController],
  providers: [
    CreateEstoqueUseCase,
    FindAllEstoquesUseCase,
    FindEstoqueByIdUseCase,
    UpdateEstoqueUseCase,
    RegistrarReposicaoEstoqueUseCase,
    ExecutarOperacaoEstoqueUseCase,
    RemoveEstoqueUseCase,
  ],
})
export class EstoqueModule {}
