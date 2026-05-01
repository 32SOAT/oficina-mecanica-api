import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVeiculoDto {
  @ApiProperty({
    description: 'Placa do veículo (formato brasileiro)',
    example: 'ABC-1234',
  })
  @IsNotEmpty()
  @IsString()
  placa: string;

  @ApiProperty({ description: 'Marca do veículo', example: 'Toyota' })
  @IsNotEmpty()
  @IsString()
  marca: string;

  @ApiProperty({ description: 'Modelo do veículo', example: 'Corolla' })
  @IsNotEmpty()
  @IsString()
  modelo: string;

  @ApiProperty({ description: 'Ano do veículo', example: 2020 })
  @IsNotEmpty()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  ano: number;

  @ApiProperty({
    description: 'Documento do cliente proprietário (CPF ou CNPJ)',
    example: '12345678901',
  })
  @IsNotEmpty()
  @IsString()
  documentoCliente: string;
}
