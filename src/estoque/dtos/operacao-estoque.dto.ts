import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoOperacaoEstoque {
  RESERVAR = 'reservar',
  DAR_BAIXA = 'dar_baixa',
}

export class OperacaoEstoqueDto {
  @ApiProperty({
    description: 'Tipo de operação no estoque',
    enum: TipoOperacaoEstoque,
    example: TipoOperacaoEstoque.RESERVAR,
  })
  @IsEnum(TipoOperacaoEstoque, {
    message: 'Operação deve ser "reservar" ou "dar_baixa".',
  })
  operacao: TipoOperacaoEstoque;

  @ApiProperty({
    description: 'Quantidade para a operação',
    example: 5,
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'Quantidade deve ser positiva.' })
  quantidade: number;
}
