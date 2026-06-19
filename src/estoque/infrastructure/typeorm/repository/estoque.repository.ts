import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstoqueRepository } from '../../../application/ports/estoque.repository';
import { Estoque } from '../../../domain/estoque';
import { EstoqueTypeormEntity } from '../entity/estoque.typeorm.entity';

@Injectable()
export class EstoqueTypeormRepository implements EstoqueRepository {
  constructor(
    @InjectRepository(EstoqueTypeormEntity)
    private readonly repository: Repository<EstoqueTypeormEntity>,
  ) {}

  async save(estoque: Estoque): Promise<Estoque> {
    const entity = EstoqueTypeormEntity.fromDomain(estoque);
    const saved = await this.repository.save(entity);
    return saved.toDomain();
  }

  async findAll(
    skip: number,
    take: number,
    estoqueBaixo?: boolean,
  ): Promise<[Estoque[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('estoque')
      .where('estoque.deleted_at IS NULL');

    if (estoqueBaixo) {
      queryBuilder.andWhere(
        '(estoque.quantidade_fisica - estoque.quantidade_reservada) <= 5',
      );
    }

    queryBuilder.skip(skip).take(take);
    const [entities, count] = await queryBuilder.getManyAndCount();
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findById(id: number): Promise<Estoque | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? entity.toDomain() : null;
  }

  async existsByCodigo(codigo: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('estoque')
      .where('estoque.codigo = :codigo', { codigo })
      .andWhere('estoque.deleted_at IS NULL');

    if (excludeId !== undefined) {
      query.andWhere('estoque.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();
    return Boolean(existing);
  }

  async softRemove(estoque: Estoque): Promise<Estoque> {
    const entity = EstoqueTypeormEntity.fromDomain(estoque);
    const removed = await this.repository.softRemove(entity);
    return removed.toDomain();
  }
}
