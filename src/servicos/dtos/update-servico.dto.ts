import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsImmutable } from '../../common/decorators/validation.decorators';

export class UpdateServicoDto {
  @ApiProperty({
    description: 'Nome do serviço',
    example: 'Troca de óleo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  servico?: string;

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
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoMaoDeObra?: number;

  @IsImmutable({ message: 'ID não pode ser alterado' })
  id?: never;
}
