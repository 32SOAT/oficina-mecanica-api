import { ApiProperty } from '@nestjs/swagger';
import { Estoque } from '../../domain/estoque';

export class EstoqueResponseDto {
  @ApiProperty({ description: 'ID único do item de estoque', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Código único do item de estoque',
    example: 'PCA-001',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nome da peça ou insumo',
    example: 'Pastilha de freio',
  })
  pecasInsumos: string;

  @ApiProperty({
    description: 'Quantidade física em estoque',
    example: 50,
  })
  quantidadeFisica: number;

  @ApiProperty({
    description: 'Quantidade reservada para ordens de serviço',
    example: 5,
  })
  quantidadeReservada: number;

  @ApiProperty({
    description: 'Quantidade disponível (física - reservada)',
    example: 45,
  })
  quantidadeDisponivel: number;

  @ApiProperty({
    description: 'Preço unitário',
    example: 89.9,
  })
  precoUnitario: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-10-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2023-10-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({ description: 'Data de exclusão (soft delete)', example: null })
  deletedAt: Date | null;

  static fromDomain(estoque: Estoque): EstoqueResponseDto {
    return {
      id: estoque.id!,
      codigo: estoque.codigo,
      pecasInsumos: estoque.pecasInsumos,
      quantidadeFisica: estoque.quantidadeFisica,
      quantidadeReservada: estoque.quantidadeReservada,
      quantidadeDisponivel: estoque.quantidadeDisponivel,
      precoUnitario: estoque.precoUnitario,
      createdAt: estoque.createdAt,
      updatedAt: estoque.updatedAt,
      deletedAt: estoque.deletedAt,
    };
  }
}
