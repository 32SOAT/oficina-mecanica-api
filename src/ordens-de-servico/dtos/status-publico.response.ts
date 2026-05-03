import { ApiProperty } from '@nestjs/swagger';
import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';

export class LinhaTempoEntry {
  @ApiProperty({ enum: StatusOrdemServico })
  status: StatusOrdemServico;

  @ApiProperty()
  em: Date;
}

export class VeiculoPublico {
  @ApiProperty({ example: 'ABC1D23' })
  placa: string;

  @ApiProperty({ example: 'Corolla' })
  modelo: string;
}

export class StatusPublicoResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: StatusOrdemServico })
  status: StatusOrdemServico;

  @ApiProperty()
  atualizadoEm: Date;

  @ApiProperty({ example: 850 })
  valorTotal: number;

  @ApiProperty({ type: VeiculoPublico })
  veiculo: VeiculoPublico;

  @ApiProperty({ type: [LinhaTempoEntry] })
  linhaDoTempo: LinhaTempoEntry[];
}
