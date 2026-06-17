import { HttpException, Inject } from '@nestjs/common';
import { VeiculoOutput } from '../dto/veiculo.output';
import { Veiculo } from '../../domain/veiculo';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

export class RemoveVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
  ) {}

  async execute(id: string): Promise<VeiculoOutput> {
    const existing = await this.veiculoRepository.findById(id);
    if (!existing) {
      throw new HttpException('Veiculo não encontrado.', 404);
    }

    const veiculo = Veiculo.create({
      id: existing.id,
      placa: existing.placa,
      marca: existing.marca,
      modelo: existing.modelo,
      ano: existing.ano,
      clienteId: existing.cliente_id,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      deletedAt: existing.deletedAt,
    });

    return this.veiculoRepository.softRemove(veiculo.softRemove());
  }
}
