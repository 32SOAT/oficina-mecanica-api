import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual', example: 'admin123' })
  @IsNotEmpty({ message: 'Senha atual é obrigatória.' })
  @IsString({ message: 'Senha atual deve ser uma string.' })
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha', example: 'novaSenha123' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória.' })
  @IsString({ message: 'Nova senha deve ser uma string.' })
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres.' })
  newPassword: string;
}
