import {
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsImmutable } from '../../common/decorators/validation.decorators';

export class UpdateClienteDto {
  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string.' })
  @MinLength(11, { message: 'Documento deve ter no mínimo 11 dígitos.' })
  @MaxLength(14, { message: 'Documento deve ter no máximo 14 dígitos.' })
  documento?: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string.' })
  nome?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string.' })
  @IsEmail({}, { message: 'Email deve ser válido.' })
  email?: string;

  @ApiProperty({
    description: 'Número do celular',
    example: '+5511999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Número do celular deve ser uma string.' })
  @IsPhoneNumber('BR', { message: 'Telefone inválido.' })
  @MinLength(10, {
    message: 'Número do celular deve ter no mínimo 10 dígitos.',
  })
  @MaxLength(15, {
    message: 'Número do celular deve ter no máximo 15 dígitos.',
  })
  celular?: string;

  @IsImmutable({ message: 'ID não pode ser alterado' })
  id?: never;
}
