import { Inject, Injectable } from '@nestjs/common';
import { HistoricoStatusReadModel } from '../read-models/ordem-servico-read-model';
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

  execute(id: string): Promise<HistoricoStatusReadModel[]> {
    return this.query.findHistorico(id);
  }
}
