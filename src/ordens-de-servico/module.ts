import { Module } from '@nestjs/common';
import { AprovarOrcamentoOrdemServicoUseCase } from './application/use-cases/aprovar-orcamento-ordem-servico.use-case';
import { AvancarStatusOrdemServicoUseCase } from './application/use-cases/avancar-status-ordem-servico.use-case';
import { CreateOrdemServicoUseCase } from './application/use-cases/create-ordem-servico.use-case';
import { FindAllOrdensServicoUseCase } from './application/use-cases/find-all-ordens-servico.use-case';
import { FindOrdemServicoByIdUseCase } from './application/use-cases/find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from './application/use-cases/find-ordem-servico-historico.use-case';
import { GerarOrcamentoOrdemServicoUseCase } from './application/use-cases/gerar-orcamento-ordem-servico.use-case';
import { GetTempoMedioServicosUseCase } from './application/use-cases/get-tempo-medio-servicos.use-case';
import { IniciarExecucaoOrdemServicoUseCase } from './application/use-cases/iniciar-execucao-ordem-servico.use-case';
import { ReprovarOrcamentoOrdemServicoUseCase } from './application/use-cases/reprovar-orcamento-ordem-servico.use-case';
import { SubstituirItensOrdemServicoUseCase } from './application/use-cases/substituir-itens-ordem-servico.use-case';
import { TransicionarOrdemServicoUseCase } from './application/use-cases/transicionar-ordem-servico.use-case';
import { OrdemServicoInfraModule } from './infrastructure/infra.module';
import { ConsultaOrdemServicoController } from './presentation/controllers/consulta-ordem-servico.controller';
import { OrdemServicoController } from './presentation/controllers/ordem-servico.controller';
import { RelatorioController } from './presentation/controllers/relatorio.controller';

@Module({
  imports: [OrdemServicoInfraModule],
  controllers: [
    ConsultaOrdemServicoController,
    OrdemServicoController,
    RelatorioController,
  ],
  providers: [
    CreateOrdemServicoUseCase,
    FindAllOrdensServicoUseCase,
    FindOrdemServicoByIdUseCase,
    FindOrdemServicoHistoricoUseCase,
    TransicionarOrdemServicoUseCase,
    SubstituirItensOrdemServicoUseCase,
    GerarOrcamentoOrdemServicoUseCase,
    AprovarOrcamentoOrdemServicoUseCase,
    ReprovarOrcamentoOrdemServicoUseCase,
    IniciarExecucaoOrdemServicoUseCase,
    AvancarStatusOrdemServicoUseCase,
    GetTempoMedioServicosUseCase,
  ],
})
export class OrdemServicoModule {}
