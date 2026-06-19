import { Inject, Injectable } from '@nestjs/common';
import { JanelaTempoInput } from '../dto/janela-tempo.input';
import { TempoMedioReadModel } from '../../application/read-models/tempo-medio-read-model';
import {
  RELATORIO_REPOSITORY,
  RelatorioRepository,
} from '../ports/relatorio.repository';

@Injectable()
export class GetTempoMedioServicosUseCase {
  constructor(
    @Inject(RELATORIO_REPOSITORY)
    private readonly relatorioRepository: RelatorioRepository,
  ) {}

  execute(janela?: JanelaTempoInput): Promise<TempoMedioReadModel> {
    return this.relatorioRepository.tempoMedioServicos(janela);
  }
}
