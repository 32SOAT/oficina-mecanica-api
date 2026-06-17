import { Inject } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class AvancarStatusOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  async execute(
    id: string,
    novo: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    if (novo === StatusOrdemServico.Aprovada) {
      return this.repository.aprovarOrcamento(id, usuarioId);
    }
    if (novo === StatusOrdemServico.Reprovada) {
      return this.repository.reprovarOrcamento(id, usuarioId);
    }
    if (novo === StatusOrdemServico.EmExecucao) {
      return this.repository.iniciarExecucao(id, usuarioId);
    }
    return this.repository.transicionar(id, novo, usuarioId);
  }
}
