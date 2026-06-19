import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../../application/ports/user.repository';
import { User } from '../../../domain/user';
import { UserTypeormEntity } from '../entity/user.typeorm.entity';

@Injectable()
export class UserTypeormRepository implements UserRepository {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly repository: Repository<UserTypeormEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const entity = UserTypeormEntity.fromDomain(user);
    const saved = await this.repository.save(entity);
    return saved.toDomain();
  }

  async findAll(skip: number, take: number): Promise<[User[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
    });
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? entity.toDomain() : null;
  }

  async remove(user: User): Promise<User> {
    const entity = UserTypeormEntity.fromDomain(user);
    const removed = await this.repository.remove(entity);
    return removed.toDomain();
  }
}
