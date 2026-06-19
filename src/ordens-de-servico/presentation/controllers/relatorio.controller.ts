import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { GetTempoMedioServicosUseCase } from '../../application/use-cases/get-tempo-medio-servicos.use-case';
import { JanelaTempoQueryDto } from '../dto/janela-tempo-query.dto';
import { TempoMedioResponseDto } from '../dto/tempo-medio-response.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatorioController {
  constructor(
    private readonly getTempoMedioServicosUseCase: GetTempoMedioServicosUseCase,
  ) {}

  @Get('tempo-medio-servicos')
  @ApiOperation({
    summary: 'Tempo médio de execução das OSs finalizadas/entregues',
    description:
      'Filtra por janela opcional `dataInicio` / `dataFim` (query). Resposta no envelope `{ data }`.',
  })
  @ApiResponse({ status: 200, description: 'Métricas calculadas.' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de data inválidos.',
  })
  async tempoMedio(@Query() query: JanelaTempoQueryDto) {
    const readModel = await this.getTempoMedioServicosUseCase.execute(query);
    return TempoMedioResponseDto.fromReadModel(readModel);
  }
}
