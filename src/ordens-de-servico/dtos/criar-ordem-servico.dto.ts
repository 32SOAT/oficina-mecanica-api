import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ItemServicoInputDto {
  @ApiProperty({ description: 'ID do serviço cadastrado', example: 1 })
  @IsInt()
  @IsPositive()
  servicoId: number;
}

export class ItemPecaInputDto {
  @ApiProperty({ description: 'ID da peça/insumo no estoque', example: 5 })
  @IsInt()
  @IsPositive()
  estoqueId: number;

  @ApiProperty({ description: 'Quantidade da peça', example: 2 })
  @IsInt()
  @IsPositive()
  quantidade: number;
}

export class CriarOrdemServicoDto {
  @ApiProperty({
    description: 'CPF ou CNPJ do cliente (apenas dígitos ou formatado)',
    example: '12345678901',
  })
  @IsNotEmpty({ message: 'Documento (CPF ou CNPJ) é obrigatório.' })
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  documentoCliente: string;

  @ApiProperty({ description: 'ID do veículo', example: 'uuid-string' })
  @IsUUID()
  veiculoId: string;

  @ApiProperty({
    description: 'Observação livre sobre a OS',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({
    type: [ItemServicoInputDto],
    description: 'Itens de serviço (mão de obra)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemServicoInputDto)
  itensServico: ItemServicoInputDto[];

  @ApiProperty({
    type: [ItemPecaInputDto],
    description: 'Itens de peças/insumos',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPecaInputDto)
  itensPeca: ItemPecaInputDto[];
}
