import { IsDefined, IsIn, IsInt, IsPositive } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { TipoOperacaoEstoque } from '../../application/dto/tipo-operacao-estoque';

export { TipoOperacaoEstoque };

export class OperacaoEstoqueDto {
  @ApiProperty({
    description: 'Tipo de operação no estoque',
    enum: TipoOperacaoEstoque,
    example: TipoOperacaoEstoque.RESERVAR,
  })
  @IsIn(
    [
      TipoOperacaoEstoque.REPOSICAO,
      TipoOperacaoEstoque.RESERVAR,
      TipoOperacaoEstoque.BAIXA,
    ],
    {
      message: 'Operação deve ser "reposicao", "reservar" ou "baixa".',
    },
  )
  operacao: TipoOperacaoEstoque;

  @ApiProperty({
    description:
      'Obrigatório. Em baixa, não pode exceder quantidade física menos reservada.',
    example: 5,
  })
  @IsDefined({
    message: 'Quantidade é obrigatória para reposição, reservar ou baixa.',
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'Quantidade deve ser positiva.' })
  quantidade: number;
}

export class EntradaReposicaoEstoqueDto extends PickType(OperacaoEstoqueDto, [
  'quantidade',
]) {}
