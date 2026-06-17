import {
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CreateVeiculoInput } from '../dto/create-veiculo.input';
import { VeiculoOutput } from '../dto/veiculo.output';
import { Veiculo } from '../../domain/veiculo';
import { InvalidPlacaError, Placa } from '../../domain/value-objects/placa';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../ports/cliente-lookup.port';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

export class CreateVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
    @Inject(CLIENTE_LOOKUP_PORT)
    private readonly clienteLookup: ClienteLookupPort,
  ) {}

  async execute(input: CreateVeiculoInput): Promise<VeiculoOutput> {
    const placa = this.buildPlaca(input.placa);

    if (await this.veiculoRepository.existsByPlaca(placa.toString())) {
      throw new ConflictException('Placa já cadastrada para outro veículo.');
    }

    const clienteId = await this.clienteLookup.resolveClienteIdByDocumento(
      input.documentoCliente,
    );

    const veiculo = Veiculo.create({
      placa,
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      clienteId,
    });

    return this.veiculoRepository.save(veiculo);
  }

  private buildPlaca(placa: string): Placa {
    try {
      return Placa.create(placa);
    } catch (error) {
      if (error instanceof InvalidPlacaError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
