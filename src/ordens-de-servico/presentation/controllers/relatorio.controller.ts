import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { RelatorioTypeormRepository } from '../../infrastructure/typeorm/repository/relatorio.repository';

class JanelaQuery {
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Início do intervalo. Opcional.',
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Fim do intervalo. Opcional.',
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

@ApiBearerAuth('JWT-auth')
@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatorioController {
  constructor(private readonly service: RelatorioTypeormRepository) {}

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
  tempoMedio(@Query() query: JanelaQuery) {
    return this.service.tempoMedioServicos(query);
  }
}
