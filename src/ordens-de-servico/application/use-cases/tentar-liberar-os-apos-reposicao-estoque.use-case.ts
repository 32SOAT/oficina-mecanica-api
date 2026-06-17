import { Inject } from '@nestjs/common';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class TentarLiberarOsAposReposicaoEstoqueUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(estoqueIds: number[], usuarioId?: string | null): Promise<void> {
    return this.repository.tentarLiberarOsAposReposicaoEstoque(
      estoqueIds,
      usuarioId,
    );
  }
}
