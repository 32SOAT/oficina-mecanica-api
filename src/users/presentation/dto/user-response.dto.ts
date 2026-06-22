import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/user';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'admin@oficina.local' })
  email: string;

  static fromDomain(user: User): UserResponseDto {
    return Object.assign(new UserResponseDto(), {
      id: user.id!,
      username: user.username,
      email: user.email,
    });
  }
}
