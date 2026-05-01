import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstoqueDto {
  @ApiProperty({
    description: 'Código único do item de estoque',
    example: 'PCA-001',
  })
  @IsNotEmpty({ message: 'Código é obrigatório.' })
  @IsString({ message: 'Código deve ser uma string.' })
  codigo: string;

  @ApiProperty({
    description: 'Nome da peça ou insumo',
    example: 'Pastilha de freio',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString({ message: 'Nome deve ser uma string.' })
  pecasInsumos: string;

  @ApiProperty({
    description: 'Quantidade física em estoque',
    example: 50,
  })
  @IsNotEmpty({ message: 'Quantidade física é obrigatória.' })
  @IsInt({ message: 'Quantidade física deve ser um número inteiro.' })
  @Min(0, { message: 'Quantidade física não pode ser negativa.' })
  quantidadeFisica: number;

  @ApiProperty({
    description: 'Preço unitário',
    example: 89.9,
  })
  @IsNotEmpty({ message: 'Preço unitário é obrigatório.' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preço unitário deve ser um número com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'Preço unitário deve ser positivo.' })
  precoUnitario: number;
}
