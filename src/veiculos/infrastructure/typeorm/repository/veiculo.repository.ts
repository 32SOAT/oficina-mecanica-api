import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VeiculoRepository } from '../../../application/ports/veiculo.repository';
import { Veiculo } from '../../../domain/veiculo';
import { VeiculoTypeormEntity } from '../entity/veiculo.typeorm.entity';

@Injectable()
export class VeiculoTypeormRepository implements VeiculoRepository {
  constructor(
    @InjectRepository(VeiculoTypeormEntity)
    private readonly repository: Repository<VeiculoTypeormEntity>,
  ) {}

  async save(veiculo: Veiculo): Promise<Veiculo> {
    const entity = VeiculoTypeormEntity.fromDomain(veiculo);
    const saved = await this.repository.save(entity);
    const withCliente = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['cliente'],
    });
    return (withCliente ?? saved).toDomain();
  }

  async findAll(
    skip: number,
    take: number,
  ): Promise<[Veiculo[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
      relations: ['cliente'],
    });
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findByPlaca(placa: string): Promise<Veiculo | null> {
    const entity = await this.repository.findOne({
      where: { placa },
      relations: ['cliente'],
    });
    return entity ? entity.toDomain() : null;
  }

  async findById(id: string): Promise<Veiculo | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['cliente'],
    });
    return entity ? entity.toDomain() : null;
  }

  async existsByPlaca(placa: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { placa } });
    return Boolean(existing);
  }

  async softRemove(veiculo: Veiculo): Promise<Veiculo> {
    const entity = VeiculoTypeormEntity.fromDomain(veiculo);
    const removed = await this.repository.softRemove(entity);
    const withCliente = await this.repository.findOne({
      where: { id: removed.id },
      relations: ['cliente'],
      withDeleted: true,
    });
    return (withCliente ?? removed).toDomain();
  }
}
