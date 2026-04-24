import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindClienteByDocumentDto {
  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
  })
  @IsNotEmpty({ message: 'Documento (CPF ou CNPJ) é obrigatório.' })
  @IsString({ message: 'Documento deve ser uma string.' })
  documento: string;
}
