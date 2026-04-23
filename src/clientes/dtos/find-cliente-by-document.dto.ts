import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindClienteByDocumentDto {
  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
  })
  @IsNotEmpty()
  @IsString()
  documento: string;
}
