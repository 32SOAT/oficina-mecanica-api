import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { FindOrdemServicoByIdUseCase } from '../../application/use-cases/find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from '../../application/use-cases/find-ordem-servico-historico.use-case';
import { StatusPublicoResponse } from '../dto/status-publico.response';

@ApiTags('Ordens de Serviço (público)')
@Controller('ordens')
export class ConsultaOrdemServicoController {
  constructor(
    private readonly findOrdemServicoByIdUseCase: FindOrdemServicoByIdUseCase,
    private readonly findOrdemServicoHistoricoUseCase: FindOrdemServicoHistoricoUseCase,
  ) {}

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
    const os = await this.findOrdemServicoByIdUseCase.execute(id);
    const historico = await this.findOrdemServicoHistoricoUseCase.execute(id);
    const veiculo = os.veiculo as { placa: string; modelo: string };
    return {
      id: os.id,
      status: os.status,
      atualizadoEm: os.updatedAt,
      valorTotal: Number(os.valorTotal),
      veiculo: { placa: veiculo.placa, modelo: veiculo.modelo },
      linhaDoTempo: historico.map((h) => ({
        status: h.statusNovo,
        em: h.createdAt,
      })),
    };
  }
}
