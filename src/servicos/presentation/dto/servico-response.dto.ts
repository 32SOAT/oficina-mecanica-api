import { ApiProperty } from '@nestjs/swagger';
import { Servico } from '../../domain/servico';

export class ServicoResponseDto {
  @ApiProperty({ description: 'ID único do serviço' })
  id: number;

  @ApiProperty({ example: 'Troca de óleo' })
  servico: string;

  @ApiProperty({ required: false })
  descricao?: string;

  @ApiProperty({ example: 150.5 })
  precoMaoDeObra: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromDomain(servico: Servico): ServicoResponseDto {
    return Object.assign(new ServicoResponseDto(), {
      id: servico.id!,
      servico: servico.nome,
      descricao: servico.descricao,
      precoMaoDeObra: servico.precoMaoDeObra,
      createdAt: servico.createdAt,
      updatedAt: servico.updatedAt,
      deletedAt: servico.deletedAt,
    });
  }
}
