import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserWithPassword } from '../../../application/dto/auth.dto';
import { AuthUserRepository } from '../../../application/ports/auth-user.repository';
import { UserEntity } from '../../../../users/infrastructure/typeorm/entity/user.typeorm.entity';

@Injectable()
export class AuthUserTypeormRepository implements AuthUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findByEmailWithPassword(
    email: string,
  ): Promise<AuthUserWithPassword | null> {
    const user = await this.repository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    return user ? this.toAuthUser(user) : null;
  }

  async findByIdWithPassword(
    id: string,
  ): Promise<AuthUserWithPassword | null> {
    const user = await this.repository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: id })
      .addSelect('user.password')
      .getOne();

    return user ? this.toAuthUser(user) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repository.update(id, { password: passwordHash });
  }

  private toAuthUser(user: UserEntity): AuthUserWithPassword {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password,
    };
  }
}
