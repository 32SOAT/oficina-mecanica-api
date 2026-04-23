import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindVeiculoByPlacaDto {
  @ApiProperty({ description: 'Placa do veículo para busca', example: 'ABC1234' })
  @IsNotEmpty()
  @IsString()
  placa: string;
}