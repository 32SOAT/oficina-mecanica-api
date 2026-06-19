import { Inject, Injectable } from '@nestjs/common';
import { FiltrosOrdemServicoInput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_QUERY_PORT,
  OrdemServicoQueryPort,
} from '../ports/ordem-servico-query.port';

@Injectable()
export class FindAllOrdensServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_QUERY_PORT)
    private readonly query: OrdemServicoQueryPort,
  ) {}

  execute(input: FiltrosOrdemServicoInput) {
    return this.query.findAll(input);
  }
}
