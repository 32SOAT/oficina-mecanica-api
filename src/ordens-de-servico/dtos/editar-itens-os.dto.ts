import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import {
  ItemPecaInputDto,
  ItemServicoInputDto,
} from './criar-ordem-servico.dto';

/** Substitui completamente os itens de serviço e peças da OS (somente em diagnóstico). */
export class EditarItensOsDto {
  @ApiProperty({
    type: [ItemServicoInputDto],
    description: 'Lista final de serviços (substitui a anterior)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemServicoInputDto)
  itensServico: ItemServicoInputDto[];

  @ApiProperty({
    type: [ItemPecaInputDto],
    description: 'Lista final de peças/insumos (substitui a anterior)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPecaInputDto)
  itensPeca: ItemPecaInputDto[];
}
