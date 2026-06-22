import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export class FiltrosOrdemServicoDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StatusOrdemServico })
  @IsOptional()
  @IsEnum(StatusOrdemServico)
  status?: StatusOrdemServico;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Data inicial (ISO yyyy-MM-dd)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final (ISO yyyy-MM-dd)',
    example: '2026-05-31',
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
