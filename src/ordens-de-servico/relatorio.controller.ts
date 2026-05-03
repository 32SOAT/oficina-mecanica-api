import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { RelatorioService } from './relatorio.service';

class JanelaQuery {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

@ApiBearerAuth()
@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatorioController {
  constructor(private readonly service: RelatorioService) {}

  @Get('tempo-medio-servicos')
  @ApiOperation({
    summary: 'Tempo médio de execução das OSs finalizadas/entregues',
  })
  tempoMedio(@Query() query: JanelaQuery) {
    return this.service.tempoMedioServicos(query);
  }
}
