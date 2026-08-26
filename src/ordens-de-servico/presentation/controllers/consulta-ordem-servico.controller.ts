import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { FindOrdemServicoByIdUseCase } from '../../application/use-cases/find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from '../../application/use-cases/find-ordem-servico-historico.use-case';
import { StatusPublicoResponse } from '../dto/status-publico.response';

@ApiBearerAuth('JWT-auth')
@ApiTags('Ordens de Serviço (cliente)')
@Controller('ordens')
export class ConsultaOrdemServicoController {
  constructor(
    private readonly findOrdemServicoByIdUseCase: FindOrdemServicoByIdUseCase,
    private readonly findOrdemServicoHistoricoUseCase: FindOrdemServicoHistoricoUseCase,
  ) {}

  @Roles('cliente')
  @Get(':id/status')
  @ApiOperation({
    summary: 'Consultar status da OS (cliente)',
    description:
      'Exige JWT com role cliente. Não expõe dados sensíveis do cliente (ex.: CPF, e-mail).',
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
  @ApiResponse({ status: 401, description: 'Token ausente, inválido ou expirado.' })
  @ApiResponse({
    status: 403,
    description: 'Token autenticado, mas o perfil não é cliente.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  async consultarStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StatusPublicoResponse> {
    const os = await this.findOrdemServicoByIdUseCase.execute(id);
    const historico = await this.findOrdemServicoHistoricoUseCase.execute(id);
    return StatusPublicoResponse.fromReadModel(os, historico);
  }
}
