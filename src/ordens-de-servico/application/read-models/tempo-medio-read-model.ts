import { JanelaTempoInput } from '../dto/janela-tempo.input';

export type TempoMedioReadModel = {
  tempoMedioMs: number;
  tempoMedioFormatado: string;
  totalOSConsideradas: number;
  janela: JanelaTempoInput | null;
};
