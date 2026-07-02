import { ApiProperty } from '@nestjs/swagger';
import { BadRequestError } from '../../../common/application/errors/application.errors';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import type {
  HistoricoStatusReadModel,
  OrdemServicoReadModel,
} from '../../application/read-models/ordem-servico-read-model';

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

  static fromReadModel(
    os: OrdemServicoReadModel,
    historico: HistoricoStatusReadModel[],
  ): StatusPublicoResponse {
    if (!os.veiculo) {
      throw new BadRequestError(
        'Veículo da ordem de serviço não está disponível para consulta.',
      );
    }

    return Object.assign(new StatusPublicoResponse(), {
      id: os.id,
      status: os.status,
      atualizadoEm: os.updatedAt,
      valorTotal: Number(os.valorTotal),
      veiculo: { placa: os.veiculo.placa, modelo: os.veiculo.modelo },
      linhaDoTempo: historico.map((h) => ({
        status: h.statusNovo,
        em: h.createdAt,
      })),
    });
  }
}
