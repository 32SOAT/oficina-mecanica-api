import { Inject } from '@nestjs/common';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class GerarOrcamentoOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(id: string, usuarioId?: string | null): Promise<OrdemServicoOutput> {
    return this.repository.gerarOrcamento(id, usuarioId);
  }
}
