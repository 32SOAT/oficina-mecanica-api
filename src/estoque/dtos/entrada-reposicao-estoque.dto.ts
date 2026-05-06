import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class EntradaReposicaoEstoqueDto {
  @ApiProperty({
    description: 'Quantidade de unidades recebidas nesta entrada',
    example: 24,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  quantidade: number;
}
