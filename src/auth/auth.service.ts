import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password!);
    if (!isValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user;
    return result;
  }

  login(user: Partial<UserEntity>) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password!);
    if (!isValid) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
