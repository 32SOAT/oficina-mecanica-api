import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicoRepository } from '../../../application/ports/servico.repository';
import { Servico } from '../../../domain/servico';
import { ServicoTypeormEntity } from '../entity/servico.typeorm.entity';

@Injectable()
export class ServicoTypeormRepository implements ServicoRepository {
  constructor(
    @InjectRepository(ServicoTypeormEntity)
    private readonly repository: Repository<ServicoTypeormEntity>,
  ) {}

  async save(servico: Servico): Promise<Servico> {
    const entity = ServicoTypeormEntity.fromDomain(servico);
    const saved = await this.repository.save(entity);
    return saved.toDomain();
  }

  async findAll(skip: number, take: number): Promise<[Servico[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
    });
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findById(id: number): Promise<Servico | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? entity.toDomain() : null;
  }

  async existsByNome(nome: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('servico')
      .where('servico.servico = :nome', { nome })
      .andWhere('servico.deletedAt IS NULL');

    if (excludeId !== undefined) {
      query.andWhere('servico.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();
    return Boolean(existing);
  }

  async softRemove(servico: Servico): Promise<Servico> {
    const entity = ServicoTypeormEntity.fromDomain(servico);
    const removed = await this.repository.softRemove(entity);
    return removed.toDomain();
  }
}
