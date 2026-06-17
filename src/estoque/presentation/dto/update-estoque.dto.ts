import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateEstoqueDto {
  @ApiPropertyOptional({
    description: 'Código único do item de estoque',
    example: 'PCA-001',
  })
  @IsOptional()
  @IsString({ message: 'Código deve ser uma string.' })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Nome da peça ou insumo',
    example: 'Pastilha de freio',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string.' })
  pecasInsumos?: string;

  @ApiPropertyOptional({
    description: 'Preço unitário',
    example: 89.9,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preço unitário deve ser um número com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'Preço unitário deve ser positivo.' })
  precoUnitario?: number;
}
