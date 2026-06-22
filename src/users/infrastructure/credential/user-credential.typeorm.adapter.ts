import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCredentialSnapshot } from '../../application/dto/user-credential.dto';
import { UserCredentialPort } from '../../application/ports/user-credential.port';
import { UserTypeormEntity } from '../typeorm/entity/user.typeorm.entity';

@Injectable()
export class UserCredentialTypeormAdapter implements UserCredentialPort {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly repository: Repository<UserTypeormEntity>,
  ) {}

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserCredentialSnapshot | null> {
    const user = await this.repository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    return user ? this.toSnapshot(user) : null;
  }

  async findByIdWithPassword(
    id: string,
  ): Promise<UserCredentialSnapshot | null> {
    const user = await this.repository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: id })
      .addSelect('user.password')
      .getOne();

    return user ? this.toSnapshot(user) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repository.update(id, { password: passwordHash });
  }

  private toSnapshot(user: UserTypeormEntity): UserCredentialSnapshot {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password,
    };
  }
}
