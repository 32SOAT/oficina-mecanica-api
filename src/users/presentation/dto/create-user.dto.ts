import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin@oficina.local' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
