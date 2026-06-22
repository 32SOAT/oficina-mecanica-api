import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';

const QUANTIDADE_NESTE_ENDPOINT =
  ' não pode ser alterada neste endpoint. Use PATCH /estoque/:id/operacao.';

export class UpdateEstoqueDto {
  @ApiPropertyOptional({
    description: 'Código único do item de estoque',
    example: 'PCA-001',
  })
  @IsOptional()
  @IsString({ message: 'Código deve ser uma string.' })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Nome da peça ou insumo',
    example: 'Pastilha de freio',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string.' })
  pecasInsumos?: string;

  @ApiPropertyOptional({
    description: 'Preço unitário',
    example: 89.9,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preço unitário deve ser um número com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'Preço unitário deve ser positivo.' })
  precoUnitario?: number;

  /** Bloqueado nesta rota — validação explícita porque o pipe global só faz whitelist. */
  @ApiHideProperty()
  @ValidateIf((dto: UpdateEstoqueDto) => dto.quantidadeFisica !== undefined)
  @IsEmpty({ message: `quantidadeFisica${QUANTIDADE_NESTE_ENDPOINT}` })
  quantidadeFisica?: number;

  @ApiHideProperty()
  @ValidateIf((dto: UpdateEstoqueDto) => dto.quantidadeReservada !== undefined)
  @IsEmpty({ message: `quantidadeReservada${QUANTIDADE_NESTE_ENDPOINT}` })
  quantidadeReservada?: number;

  @ApiHideProperty()
  @ValidateIf((dto: UpdateEstoqueDto) => dto.quantidadeResrvada !== undefined)
  @IsEmpty({ message: `quantidadeResrvada${QUANTIDADE_NESTE_ENDPOINT}` })
  quantidadeResrvada?: number;
}
