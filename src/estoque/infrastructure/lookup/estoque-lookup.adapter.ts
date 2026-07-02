import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EstoqueLookupPort,
  EstoqueSnapshot,
} from '../../application/ports/estoque-lookup.port';
import { EstoqueTypeormEntity } from '../typeorm/entity/estoque.typeorm.entity';

@Injectable()
export class EstoqueLookupAdapter implements EstoqueLookupPort {
  constructor(
    @InjectRepository(EstoqueTypeormEntity)
    private readonly repository: Repository<EstoqueTypeormEntity>,
  ) {}

  async findSnapshotById(
    id: number,
    options?: { includeDeleted?: boolean },
  ): Promise<EstoqueSnapshot | null> {
    const estoque = await this.repository.findOne({
      where: { id },
      withDeleted: options?.includeDeleted ?? false,
    });
    if (!estoque) {
      return null;
    }
    return {
      id: estoque.id,
      codigo: estoque.codigo,
      pecasInsumos: estoque.pecasInsumos,
      quantidadeFisica: estoque.quantidadeFisica,
      quantidadeReservada: estoque.quantidadeReservada,
      precoUnitario: Number(estoque.precoUnitario),
    };
  }
}
