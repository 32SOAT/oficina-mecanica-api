import { IsDefined, IsIn, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoOperacaoEstoque {
  REPOSICAO = 'reposicao',
  RESERVAR = 'reservar',
}

export class OperacaoEstoqueDto {
  @ApiProperty({
    description: 'Tipo de operação no estoque',
    enum: TipoOperacaoEstoque,
    example: TipoOperacaoEstoque.RESERVAR,
  })
  @IsIn([TipoOperacaoEstoque.REPOSICAO, TipoOperacaoEstoque.RESERVAR], {
    message: 'Operação deve ser "reposicao" ou "reservar".',
  })
  operacao: TipoOperacaoEstoque;

  @ApiProperty({
    description: 'Obrigatório para reposição ou reservar.',
    example: 5,
  })
  @IsDefined({
    message: 'Quantidade é obrigatória para reposição ou reservar.',
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'Quantidade deve ser positiva.' })
  quantidade: number;
}
