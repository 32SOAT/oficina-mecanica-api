import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteTypeormEntity } from '../../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import {
  ClienteResumoOutput,
  VeiculoOutput,
} from '../../../application/dto/veiculo.output';
import { VeiculoRepository } from '../../../application/ports/veiculo.repository';
import { Veiculo } from '../../../domain/veiculo';
import { VeiculoTypeormEntity } from '../entity/veiculo.typeorm.entity';

@Injectable()
export class VeiculoTypeormRepository implements VeiculoRepository {
  constructor(
    @InjectRepository(VeiculoTypeormEntity)
    private readonly repository: Repository<VeiculoTypeormEntity>,
  ) {}

  async save(veiculo: Veiculo): Promise<VeiculoOutput> {
    const entity = VeiculoTypeormEntity.fromDomain(veiculo);
    const saved = await this.repository.save(entity);
    const withCliente = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['cliente'],
    });
    return this.toOutput(withCliente ?? saved);
  }

  async findAll(
    skip: number,
    take: number,
  ): Promise<[VeiculoOutput[], number]> {
    const [entities, count] = await this.repository.findAndCount({
      skip,
      take,
      relations: ['cliente'],
    });
    return [entities.map((entity) => this.toOutput(entity)), count];
  }

  async findByPlaca(placa: string): Promise<VeiculoOutput | null> {
    const entity = await this.repository.findOne({
      where: { placa },
      relations: ['cliente'],
    });
    return entity ? this.toOutput(entity) : null;
  }

  async findById(id: string): Promise<VeiculoOutput | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['cliente'],
    });
    return entity ? this.toOutput(entity) : null;
  }

  async existsByPlaca(placa: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { placa } });
    return Boolean(existing);
  }

  async softRemove(veiculo: Veiculo): Promise<VeiculoOutput> {
    const entity = VeiculoTypeormEntity.fromDomain(veiculo);
    const removed = await this.repository.softRemove(entity);
    const withCliente = await this.repository.findOne({
      where: { id: removed.id },
      relations: ['cliente'],
      withDeleted: true,
    });
    return this.toOutput(withCliente ?? removed);
  }

  private toOutput(entity: VeiculoTypeormEntity): VeiculoOutput {
    return {
      id: entity.id,
      placa: entity.placa,
      marca: entity.marca,
      modelo: entity.modelo,
      ano: entity.ano,
      cliente_id: entity.cliente_id,
      cliente: entity.cliente
        ? this.toClienteResumo(entity.cliente)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private toClienteResumo(cliente: ClienteTypeormEntity): ClienteResumoOutput {
    return {
      id: cliente.id,
      documento: cliente.documento,
      nome: cliente.nome,
      email: cliente.email,
      celularNumero: cliente.celularNumero,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      deletedAt: cliente.deletedAt,
    };
  }
}
