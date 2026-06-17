import { Inject } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class TransicionarOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(
    id: string,
    status: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    return this.repository.transicionar(id, status, usuarioId);
  }
}
