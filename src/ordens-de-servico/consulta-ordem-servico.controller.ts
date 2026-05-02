import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdemServicoService } from './ordem-servico.service';
import { StatusPublicoResponse } from './dtos/status-publico.response';

@ApiTags('Ordens de Serviço (público)')
@Controller('ordens')
export class ConsultaOrdemServicoController {
  constructor(private readonly service: OrdemServicoService) {}

  @Get(':id/status')
  @ApiOperation({
    summary: 'Consulta pública do status da OS (sem autenticação)',
  })
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
