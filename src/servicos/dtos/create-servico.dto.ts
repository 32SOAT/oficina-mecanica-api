import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServicoDto {
  @ApiProperty({
    description: 'Nome do serviço',
    example: 'Troca de óleo',
  })
  @IsNotEmpty()
  @IsString()
  servico: string;

  @ApiProperty({
    description: 'Descrição do serviço',
    example: 'Troca de óleo e filtro do motor',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Preço da mão de obra',
    example: 150.5,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoMaoDeObra: number;
}
