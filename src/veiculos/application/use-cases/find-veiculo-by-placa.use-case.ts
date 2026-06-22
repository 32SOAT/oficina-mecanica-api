import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { Veiculo } from '../../domain/veiculo';
import { InvalidPlacaError, Placa } from '../../domain/value-objects/placa';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

@Injectable()
export class FindVeiculoByPlacaUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
  ) {}

  async execute(placaRaw: string): Promise<Veiculo> {
    const placa = this.buildPlaca(placaRaw);
    const veiculo = await this.veiculoRepository.findByPlaca(placa.toString());

    if (!veiculo) {
      throw new NotFoundError('Veiculo não encontrado.');
    }

    return veiculo;
  }

  private buildPlaca(placa: string): Placa {
    try {
      return Placa.create(placa);
    } catch (error) {
      if (error instanceof InvalidPlacaError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}
