import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VeiculoLookupPort,
  VeiculoSnapshot,
} from '../../application/ports/veiculo-lookup.port';
import { VeiculoTypeormEntity } from '../typeorm/entity/veiculo.typeorm.entity';

@Injectable()
export class VeiculoLookupAdapter implements VeiculoLookupPort {
  constructor(
    @InjectRepository(VeiculoTypeormEntity)
    private readonly repository: Repository<VeiculoTypeormEntity>,
  ) {}

  async findSnapshotById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<VeiculoSnapshot | null> {
    const veiculo = await this.repository.findOne({
      where: { id },
      withDeleted: options?.includeDeleted ?? false,
    });
    if (!veiculo) {
      return null;
    }
    return {
      id: veiculo.id,
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      cliente_id: veiculo.cliente_id,
      createdAt: veiculo.createdAt,
      updatedAt: veiculo.updatedAt,
      deletedAt: veiculo.deletedAt,
    };
  }
}
