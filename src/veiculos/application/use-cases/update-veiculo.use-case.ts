import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { UpdateVeiculoInput } from '../dto/update-veiculo.input';
import { Veiculo } from '../../domain/veiculo';import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../../../clientes/application/ports/cliente-lookup.port';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

@Injectable()
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
  ): Promise<Veiculo> {
    const existing = await this.veiculoRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Veiculo não encontrado.');
    }

    let clienteId = existing.clienteId;
    if (input.documentoCliente !== undefined) {
      clienteId = await this.clienteLookup.resolveClienteIdByDocumento(
        input.documentoCliente,
      );
    }

    const updated = existing.update({
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      clienteId,
    });

    return this.veiculoRepository.save(updated);
  }
}