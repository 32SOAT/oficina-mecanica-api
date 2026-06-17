import { Inject } from '@nestjs/common';
import { HistoricoStatusOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class FindOrdemServicoHistoricoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(id: string): Promise<HistoricoStatusOutput[]> {
    return this.repository.findHistorico(id);
  }
}
