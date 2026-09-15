import { JanelaTempoInput } from '../dto/janela-tempo.input';
import { TempoMedioReadModel } from '../read-models/tempo-medio-read-model';

export const RELATORIO_REPOSITORY = 'RELATORIO_REPOSITORY';

export type MediaTempoFase = {
  fase: 'diagnostico' | 'execucao' | 'finalizacao';
  segundos: number;
};

export abstract class RelatorioRepository {
  abstract tempoMedioFases(): Promise<MediaTempoFase[]>;

  abstract tempoMedioServicos(
    janela?: JanelaTempoInput,
  ): Promise<TempoMedioReadModel>;
}
