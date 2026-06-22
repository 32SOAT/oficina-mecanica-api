import { Module } from '@nestjs/common';
import { CreateServicoUseCase } from './application/use-cases/create-servico.use-case';
import { FindAllServicosUseCase } from './application/use-cases/find-all-servicos.use-case';
import { FindServicoByIdUseCase } from './application/use-cases/find-servico-by-id.use-case';
import { UpdateServicoUseCase } from './application/use-cases/update-servico.use-case';
import { RemoveServicoUseCase } from './application/use-cases/remove-servico.use-case';
import { ServicoInfraModule } from './infrastructure/infra.module';
import { ServicoController } from './presentation/controllers/servico.controller';

@Module({
  imports: [ServicoInfraModule],
  controllers: [ServicoController],
  providers: [
    CreateServicoUseCase,
    FindAllServicosUseCase,
    FindServicoByIdUseCase,
    UpdateServicoUseCase,
    RemoveServicoUseCase,
  ],
})
export class ServicoModule {}
