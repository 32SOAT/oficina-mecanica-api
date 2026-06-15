import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { MAX_PAGE_NUMBER, MAX_PAGE_SIZE } from '../constants';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Itens por página',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Take deve ser um número inteiro.' })
  @IsPositive({ message: 'Take deve ser positivo.' })
  @Max(MAX_PAGE_SIZE, { message: 'Take excede o limite permitido.' })
  take?: number;

  @ApiPropertyOptional({
    description: 'Número da página (a partir de 1)',
    minimum: 1,
    maximum: MAX_PAGE_NUMBER,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page deve ser um número inteiro.' })
  @IsPositive({ message: 'Page deve ser positivo.' })
  @Max(MAX_PAGE_NUMBER, { message: 'Page excede o limite permitido. ' })
  page?: number;
}
