import { ApiProperty } from '@nestjs/swagger';
import { LoginOutput } from '../../application/dto/auth.dto';

class UserDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome de usuário' })
  username: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Dados do usuário', type: UserDto })
  user: UserDto;

  @ApiProperty({ description: 'Token JWT' })
  token: string;

  static fromOutput(output: LoginOutput): LoginResponseDto {
    return Object.assign(new LoginResponseDto(), output);
  }
}
