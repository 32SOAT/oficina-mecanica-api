import { ApiProperty } from '@nestjs/swagger';
import { ServicoOutput } from '../../application/dto/servico.output';

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

  static fromOutput(output: ServicoOutput): ServicoResponseDto {
    return Object.assign(new ServicoResponseDto(), output);
  }
}
