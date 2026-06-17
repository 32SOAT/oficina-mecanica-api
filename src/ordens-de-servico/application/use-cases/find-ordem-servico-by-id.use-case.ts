import { Inject } from '@nestjs/common';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class FindOrdemServicoByIdUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(id: string): Promise<OrdemServicoOutput> {
    return this.repository.findById(id);
  }
}
