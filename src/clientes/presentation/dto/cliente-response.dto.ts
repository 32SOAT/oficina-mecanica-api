import { ApiProperty } from '@nestjs/swagger';
import { ClienteOutput } from '../../application/dto/cliente.output';

export class ClienteResponseDto {
  @ApiProperty({ description: 'ID único do cliente', example: 'uuid-string' })
  id: string;

  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
  })
  documento: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Número do celular',
    example: '+5511999999999',
  })
  celularNumero: string;

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

  @ApiProperty({
    description: 'Data de exclusão (soft delete)',
    example: null,
  })
  deletedAt: Date | null;

  static fromOutput(output: ClienteOutput): ClienteResponseDto {
    return Object.assign(new ClienteResponseDto(), output);
  }
}
