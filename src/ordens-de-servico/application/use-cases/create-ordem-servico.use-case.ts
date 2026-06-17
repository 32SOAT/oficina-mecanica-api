import { Inject } from '@nestjs/common';
import {
  CriarOrdemServicoInput,
  OrdemServicoOutput,
} from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class CreateOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(
    input: CriarOrdemServicoInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    return this.repository.criar(input, usuarioId);
  }
}
