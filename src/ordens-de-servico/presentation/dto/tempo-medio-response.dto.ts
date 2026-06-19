import { ApiProperty } from '@nestjs/swagger';
import type { TempoMedioReadModel } from '../../application/read-models/tempo-medio-read-model';

class JanelaTempoResponseDto {
  @ApiProperty({ required: false, example: '2026-01-01' })
  dataInicio?: string;

  @ApiProperty({ required: false, example: '2026-05-01' })
  dataFim?: string;
}

export class TempoMedioResponseDto {
  @ApiProperty({ example: 86400000 })
  tempoMedioMs: number;

  @ApiProperty({ example: '24h 0min' })
  tempoMedioFormatado: string;

  @ApiProperty({ example: 12 })
  totalOSConsideradas: number;

  @ApiProperty({ type: () => JanelaTempoResponseDto, nullable: true })
  janela: JanelaTempoResponseDto | null;

  static fromReadModel(readModel: TempoMedioReadModel): TempoMedioResponseDto {
    return Object.assign(new TempoMedioResponseDto(), readModel);
  }
}
