import { ApiProperty } from '@nestjs/swagger';
import type { LoginReadModel } from '../../application/read-models/auth-read-model';

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

  static fromReadModel(readModel: LoginReadModel): LoginResponseDto {
    return Object.assign(new LoginResponseDto(), readModel);
  }
}
