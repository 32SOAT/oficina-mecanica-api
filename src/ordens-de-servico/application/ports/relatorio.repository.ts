import { JanelaTempoInput } from '../dto/janela-tempo.input';
import { TempoMedioReadModel } from '../read-models/tempo-medio-read-model';

export const RELATORIO_REPOSITORY = 'RELATORIO_REPOSITORY';

export abstract class RelatorioRepository {
  abstract tempoMedioServicos(
    janela?: JanelaTempoInput,
  ): Promise<TempoMedioReadModel>;
}
