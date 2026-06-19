import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class JanelaTempoQueryDto {
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
