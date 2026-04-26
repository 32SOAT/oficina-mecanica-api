import {
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
  })
  @IsNotEmpty({ message: 'Documento (CPF ou CNPJ) é obrigatório.' })
  @IsString({ message: 'Documento deve ser uma string.' })
  @MinLength(11, { message: 'Documento deve ter no mínimo 11 dígitos.' })
  @MaxLength(14, { message: 'Documento deve ter no máximo 14 dígitos.' })
  documento: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString({ message: 'Nome deve ser uma string.' })
  nome: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
  })
  @IsNotEmpty({ message: 'Email é obrigatório.' })
  @IsString({ message: 'Email deve ser uma string.' })
  @IsEmail({}, { message: 'Email deve ser válido.' })
  email: string;

  @ApiProperty({
    description: 'Número do celular',
    example: '+5511999999999',
  })
  @IsNotEmpty({ message: 'Número do celular é obrigatório.' })
  @IsString({ message: 'Número do celular deve ser uma string.' })
  @IsPhoneNumber('BR', { message: 'Telefone inválido.' })
  @MinLength(10, {
    message: 'Número do celular deve ter no mínimo 10 dígitos.',
  })
  @MaxLength(15, {
    message: 'Número do celular deve ter no máximo 15 dígitos.',
  })
  celularNumero: string;
}
