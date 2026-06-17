import { Inject } from '@nestjs/common';
import { EditarItensOsInput, OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class SubstituirItensOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(
    id: string,
    input: EditarItensOsInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    return this.repository.substituirItensEmDiagnostico(id, input, usuarioId);
  }
}
