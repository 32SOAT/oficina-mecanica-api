import {
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoOperacaoEstoque {
  ADICIONAR = 'adicionar',
  REPOSICAO = 'reposicao',
  RESERVAR = 'reservar',
  DAR_BAIXA = 'dar_baixa',
}

/**
 * Payload unificado para `PATCH /estoque/:id/operacao`.
 * - `adicionar`: cadastra SKU novo; o `id` na URL é ignorado (ex.: `0`).
 * - `reposicao`: soma à quantidade física; exige `id` e `quantidade`; usa o usuário do JWT.
 * - `reservar` / `dar_baixa`: exige `id` e `quantidade`.
 */
export class OperacaoEstoqueDto {
  @ApiProperty({
    description: 'Tipo de operação no estoque',
    enum: TipoOperacaoEstoque,
    example: TipoOperacaoEstoque.RESERVAR,
  })
  @IsIn(
    [
      TipoOperacaoEstoque.ADICIONAR,
      TipoOperacaoEstoque.REPOSICAO,
      TipoOperacaoEstoque.RESERVAR,
      TipoOperacaoEstoque.DAR_BAIXA,
    ],
    {
      message:
        'Operação deve ser "adicionar", "reposicao", "reservar" ou "dar_baixa".',
    },
  )
  operacao: TipoOperacaoEstoque;

  @ApiProperty({
    description:
      'Obrigatório para reposição, reservar ou dar baixa. Ignorado quando operação é adicionar.',
    example: 5,
    required: false,
  })
  @ValidateIf(
    (o) =>
      o.operacao === TipoOperacaoEstoque.REPOSICAO ||
      o.operacao === TipoOperacaoEstoque.RESERVAR ||
      o.operacao === TipoOperacaoEstoque.DAR_BAIXA,
  )
  @IsDefined({
    message:
      'Quantidade é obrigatória para reposição, reservar ou dar baixa.',
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'Quantidade deve ser positiva.' })
  quantidade?: number;

  @ApiProperty({
    description: 'Obrigatório quando operação é adicionar.',
    required: false,
  })
  @ValidateIf((o) => o.operacao === TipoOperacaoEstoque.ADICIONAR)
  @IsNotEmpty({ message: 'Código é obrigatório.' })
  @IsString({ message: 'Código deve ser uma string.' })
  codigo?: string;

  @ApiProperty({
    description: 'Obrigatório quando operação é adicionar.',
    required: false,
  })
  @ValidateIf((o) => o.operacao === TipoOperacaoEstoque.ADICIONAR)
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString({ message: 'Nome deve ser uma string.' })
  pecasInsumos?: string;

  @ApiProperty({
    description: 'Obrigatório quando operação é adicionar.',
    required: false,
  })
  @ValidateIf((o) => o.operacao === TipoOperacaoEstoque.ADICIONAR)
  @IsDefined({ message: 'Quantidade física é obrigatória.' })
  @IsInt({ message: 'Quantidade física deve ser um número inteiro.' })
  @Min(0, { message: 'Quantidade física não pode ser negativa.' })
  quantidadeFisica?: number;

  @ApiProperty({
    description: 'Obrigatório quando operação é adicionar.',
    required: false,
  })
  @ValidateIf((o) => o.operacao === TipoOperacaoEstoque.ADICIONAR)
  @IsDefined({ message: 'Preço unitário é obrigatório.' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preço unitário deve ser um número com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'Preço unitário deve ser positivo.' })
  precoUnitario?: number;
}
