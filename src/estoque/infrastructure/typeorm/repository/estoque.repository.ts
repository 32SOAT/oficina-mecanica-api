import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstoqueOutput } from '../../../application/dto/estoque.output';
import { EstoqueRepository } from '../../../application/ports/estoque.repository';
import { Estoque } from '../../../domain/estoque';
import { EstoqueTypeormEntity } from '../entity/estoque.typeorm.entity';

@Injectable()
export class EstoqueTypeormRepository implements EstoqueRepository {
  constructor(
    @InjectRepository(EstoqueTypeormEntity)
    private readonly repository: Repository<EstoqueTypeormEntity>,
  ) {}

  async save(estoque: Estoque): Promise<EstoqueOutput> {
    const entity = EstoqueTypeormEntity.fromDomain(estoque);
    const saved = await this.repository.save(entity);
    return this.toOutput(saved);
  }

  async findAll(
    skip: number,
    take: number,
    estoqueBaixo?: boolean,
  ): Promise<[EstoqueOutput[], number]> {
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
    return [entities.map((entity) => this.toOutput(entity)), count];
  }

  async findById(id: number): Promise<EstoqueOutput | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toOutput(entity) : null;
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

  async softRemove(estoque: Estoque): Promise<EstoqueOutput> {
    const entity = EstoqueTypeormEntity.fromDomain(estoque);
    const removed = await this.repository.softRemove(entity);
    return this.toOutput(removed);
  }

  private toOutput(entity: EstoqueTypeormEntity): EstoqueOutput {
    return {
      id: entity.id,
      codigo: entity.codigo,
      pecasInsumos: entity.pecasInsumos,
      quantidadeFisica: entity.quantidadeFisica,
      quantidadeReservada: entity.quantidadeReservada,
      quantidadeDisponivel: entity.quantidadeDisponivel,
      precoUnitario: Number(entity.precoUnitario),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
