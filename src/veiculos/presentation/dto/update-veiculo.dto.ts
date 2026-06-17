import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsImmutable } from '../../../common/decorators/validation.decorators';

export class UpdateVeiculoDto {
  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Corolla',
    required: false,
  })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiProperty({
    description: 'Ano do veículo',
    example: 2020,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  ano?: number;

  @ApiProperty({
    description: 'Documento do cliente proprietário do veículo (CPF ou CNPJ)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentoCliente?: string;

  @IsImmutable({ message: 'ID não pode ser alterado' })
  id?: never;

  @IsImmutable({ message: 'Placa não pode ser alterada' })
  placa?: never;
}
