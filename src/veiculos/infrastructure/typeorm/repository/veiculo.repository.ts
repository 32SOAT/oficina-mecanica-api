import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../../../../clientes/application/ports/cliente-lookup.port';
import { ClienteTypeormEntity } from '../../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { VeiculoRepository } from '../../../application/ports/veiculo.repository';
import { Veiculo } from '../../../domain/veiculo';
import { VeiculoTypeormEntity } from '../entity/veiculo.typeorm.entity';

@Injectable()
export class VeiculoTypeormRepository implements VeiculoRepository {
  constructor(
    @InjectRepository(VeiculoTypeormEntity)
    private readonly repository: Repository<VeiculoTypeormEntity>,
    @Inject(CLIENTE_LOOKUP_PORT)
    private readonly clienteLookup: ClienteLookupPort,
  ) {}

  async save(veiculo: Veiculo): Promise<Veiculo> {
    const entity = VeiculoTypeormEntity.fromDomain(veiculo);
    const saved = await this.repository.save(entity);
    const withCliente = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['cliente'],
    });
    const loaded = withCliente ?? saved;
    await this.enrichClienteForRead(loaded);
    return loaded.toDomain();
  }

  async findAll(skip: number, take: number): Promise<[Veiculo[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
      relations: ['cliente'],
    });
    await Promise.all(entities.map((entity) => this.enrichClienteForRead(entity)));
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findByPlaca(placa: string): Promise<Veiculo | null> {
    const entity = await this.repository.findOne({
      where: { placa },
      relations: ['cliente'],
    });
    if (!entity) {
      return null;
    }
    await this.enrichClienteForRead(entity);
    return entity.toDomain();
  }

  async findById(id: string): Promise<Veiculo | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['cliente'],
    });
    if (!entity) {
      return null;
    }
    await this.enrichClienteForRead(entity);
    return entity.toDomain();
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
    const loaded = withCliente ?? removed;
    await this.enrichClienteForRead(loaded);
    return loaded.toDomain();
  }

  private async enrichClienteForRead(entity: VeiculoTypeormEntity): Promise<void> {
    if (entity.cliente || !entity.cliente_id) {
      return;
    }
    const snapshot = await this.clienteLookup.findSnapshotById(
      entity.cliente_id,
      { includeDeleted: true },
    );
    if (!snapshot) {
      return;
    }
    entity.cliente = Object.assign(new ClienteTypeormEntity(), snapshot);
  }
}
