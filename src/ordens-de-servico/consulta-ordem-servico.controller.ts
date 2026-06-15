import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdemServicoService } from './ordem-servico.service';
import { StatusPublicoResponse } from './dtos/status-publico.response';
import { Public } from '../auth/public.decorator';

@ApiTags('Ordens de Serviço (público)')
@Controller('ordens')
export class ConsultaOrdemServicoController {
  constructor(private readonly service: OrdemServicoService) {}

  @Public()
  @Get(':id/status')
  @ApiOperation({
    summary: 'Consulta pública do status da OS',
    description:
      'Não exige JWT. Não expõe dados sensíveis do cliente (ex.: CPF, e-mail).',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiOkResponse({
    description: 'Status atual, valor, veículo (placa/modelo) e linha do tempo',
    type: StatusPublicoResponse,
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  async consultarStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StatusPublicoResponse> {
    const os = await this.service.findOne(id);
    const historico = await this.service.findHistorico(id);
    return {
      id: os.id,
      status: os.status,
      atualizadoEm: os.updatedAt,
      valorTotal: Number(os.valorTotal),
      veiculo: { placa: os.veiculo.placa, modelo: os.veiculo.modelo },
      linhaDoTempo: historico.map((h) => ({
        status: h.statusNovo,
        em: h.createdAt,
      })),
    };
  }
}
