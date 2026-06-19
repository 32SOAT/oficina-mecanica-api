import { ApiProperty } from '@nestjs/swagger';
import type { HistoricoStatusReadModel } from '../../application/read-models/ordem-servico-read-model';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export class HistoricoStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  os_id: string;

  @ApiProperty({ enum: StatusOrdemServico, nullable: true })
  statusAnterior: StatusOrdemServico | null;

  @ApiProperty({ enum: StatusOrdemServico })
  statusNovo: StatusOrdemServico;

  @ApiProperty({ nullable: true })
  usuarioId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromReadModel(
    readModel: HistoricoStatusReadModel,
  ): HistoricoStatusResponseDto {
    return Object.assign(new HistoricoStatusResponseDto(), readModel);
  }
}
