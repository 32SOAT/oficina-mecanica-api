import { Inject, Injectable } from '@nestjs/common';
import { HistoricoStatusOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_QUERY_PORT,
  OrdemServicoQueryPort,
} from '../ports/ordem-servico-query.port';

@Injectable()
export class FindOrdemServicoHistoricoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_QUERY_PORT)
    private readonly query: OrdemServicoQueryPort,
  ) {}

  execute(id: string): Promise<HistoricoStatusOutput[]> {
    return this.query.findHistorico(id);
  }
}
