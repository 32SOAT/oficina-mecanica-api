import { Injectable } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import { AprovarOrcamentoOrdemServicoUseCase } from './aprovar-orcamento-ordem-servico.use-case';
import { IniciarExecucaoOrdemServicoUseCase } from './iniciar-execucao-ordem-servico.use-case';
import { ReprovarOrcamentoOrdemServicoUseCase } from './reprovar-orcamento-ordem-servico.use-case';
import { TransicionarOrdemServicoUseCase } from './transicionar-ordem-servico.use-case';

@Injectable()
export class AvancarStatusOrdemServicoUseCase {
  constructor(
    private readonly aprovarOrcamento: AprovarOrcamentoOrdemServicoUseCase,
    private readonly reprovarOrcamento: ReprovarOrcamentoOrdemServicoUseCase,
    private readonly iniciarExecucao: IniciarExecucaoOrdemServicoUseCase,
    private readonly transicionar: TransicionarOrdemServicoUseCase,
  ) {}

  execute(
    id: string,
    novo: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    if (novo === StatusOrdemServico.Aprovada) {
      return this.aprovarOrcamento.execute(id, usuarioId);
    }
    if (novo === StatusOrdemServico.Reprovada) {
      return this.reprovarOrcamento.execute(id, usuarioId);
    }
    if (novo === StatusOrdemServico.EmExecucao) {
      return this.iniciarExecucao.execute(id, usuarioId);
    }
    return this.transicionar.execute(id, novo, usuarioId);
  }
}
