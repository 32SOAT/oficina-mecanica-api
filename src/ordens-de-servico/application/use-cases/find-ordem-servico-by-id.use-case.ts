import { Inject, Injectable } from '@nestjs/common';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_QUERY_PORT,
  OrdemServicoQueryPort,
} from '../ports/ordem-servico-query.port';

@Injectable()
export class FindOrdemServicoByIdUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_QUERY_PORT)
    private readonly query: OrdemServicoQueryPort,
  ) {}

  execute(id: string): Promise<OrdemServicoOutput> {
    return this.query.findById(id);
  }
}
