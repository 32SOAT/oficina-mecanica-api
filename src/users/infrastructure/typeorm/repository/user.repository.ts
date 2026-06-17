import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOutput } from '../../../application/dto/user.dto';
import { UserRepository } from '../../../application/ports/user.repository';
import { User } from '../../../domain/user';
import { UserTypeormEntity } from '../entity/user.typeorm.entity';

@Injectable()
export class UserTypeormRepository implements UserRepository {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly repository: Repository<UserTypeormEntity>,
  ) {}

  async save(user: User): Promise<UserOutput> {
    const entity = UserTypeormEntity.fromDomain(user);
    const saved = await this.repository.save(entity);
    return this.toOutput(saved);
  }

  async findAll(skip: number, take: number): Promise<[UserOutput[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
    });
    return [entities.map((entity) => this.toOutput(entity)), count];
  }

  async findById(id: string): Promise<UserOutput | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toOutput(entity) : null;
  }

  async remove(user: User): Promise<UserOutput> {
    const entity = UserTypeormEntity.fromDomain(user);
    const removed = await this.repository.remove(entity);
    return this.toOutput(removed);
  }

  private toOutput(entity: UserTypeormEntity): UserOutput {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
    };
  }
}
