import { Inject } from '@nestjs/common';
import { FiltrosOrdemServicoInput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../ports/ordem-servico.repository';

export class FindAllOrdensServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: OrdemServicoRepository,
  ) {}

  execute(input: FiltrosOrdemServicoInput) {
    return this.repository.findAll(input);
  }
}
