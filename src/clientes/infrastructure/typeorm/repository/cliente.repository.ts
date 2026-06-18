import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Cliente } from '../../../domain/cliente';
import { ClienteRepository } from '../../../application/ports/cliente.repository';
import { ClienteTypeormEntity } from '../entity/cliente.typeorm.entity';

@Injectable()
export class ClienteTypeormRepository implements ClienteRepository {
  constructor(
    @InjectRepository(ClienteTypeormEntity)
    private readonly clienteRepository: Repository<ClienteTypeormEntity>,
  ) {}

  async save(cliente: Cliente): Promise<Cliente> {
    const entity = ClienteTypeormEntity.fromDomain(cliente);
    const saved = await this.clienteRepository.save(entity);
    return saved.toDomain();
  }

  async findAll(skip: number, take: number): Promise<[Cliente[], number]> {
    const [entities, count] = await this.clienteRepository.findAndCount({
      where: { deletedAt: IsNull() },
      skip,
      take,
    });
    return [entities.map((entity) => entity.toDomain()), count];
  }

  async findByDocumento(documento: string): Promise<Cliente | null> {
    const entity = await this.clienteRepository.findOne({
      where: { documento },
    });
    return entity ? entity.toDomain() : null;
  }

  async findById(id: string): Promise<Cliente | null> {
    const entity = await this.clienteRepository.findOneBy({ id });
    return entity ? entity.toDomain() : null;
  }

  async existsByDocumento(
    documento: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.documento = :documento', { documento })
      .andWhere('cliente.deletedAt IS NULL');

    if (excludeId) {
      query.andWhere('cliente.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();
    return Boolean(existing);
  }

  async softRemove(cliente: Cliente): Promise<Cliente> {
    const entity = ClienteTypeormEntity.fromDomain(cliente);
    const removed = await this.clienteRepository.softRemove(entity);
    return removed.toDomain();
  }
}
