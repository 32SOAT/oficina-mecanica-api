import { HttpException, Inject } from '@nestjs/common';
import { UpdateVeiculoInput } from '../dto/update-veiculo.input';
import { VeiculoOutput } from '../dto/veiculo.output';
import { Veiculo } from '../../domain/veiculo';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../ports/cliente-lookup.port';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

export class UpdateVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
    @Inject(CLIENTE_LOOKUP_PORT)
    private readonly clienteLookup: ClienteLookupPort,
  ) {}

  async execute(
    id: string,
    input: UpdateVeiculoInput,
  ): Promise<VeiculoOutput> {
    const existing = await this.veiculoRepository.findById(id);
    if (!existing) {
      throw new HttpException('Veiculo não encontrado.', 404);
    }

    let clienteId = existing.cliente_id;
    if (input.documentoCliente !== undefined) {
      clienteId = await this.clienteLookup.resolveClienteIdByDocumento(
        input.documentoCliente,
      );
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

    const updated = veiculo.update({
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      clienteId,
    });

    return this.veiculoRepository.save(updated);
  }
}
