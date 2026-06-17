import { ApiProperty } from '@nestjs/swagger';
import { VeiculoOutput } from '../../application/dto/veiculo.output';

export class ClienteResumoResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: '12345678901' })
  documento: string;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'joao@email.com' })
  email: string;

  @ApiProperty({ example: '+5511999999999' })
  celularNumero: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;
}

export class VeiculoResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'ABC1234' })
  placa: string;

  @ApiProperty({ example: 'Toyota' })
  marca: string;

  @ApiProperty({ example: 'Corolla' })
  modelo: string;

  @ApiProperty({ example: 2020 })
  ano: number;

  @ApiProperty({ example: 'uuid-string' })
  cliente_id: string;

  @ApiProperty({ type: () => ClienteResumoResponseDto, required: false })
  cliente?: ClienteResumoResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromOutput(output: VeiculoOutput): VeiculoResponseDto {
    return Object.assign(new VeiculoResponseDto(), {
      ...output,
      cliente: output.cliente
        ? Object.assign(new ClienteResumoResponseDto(), output.cliente)
        : undefined,
    });
  }
}
