import { BadRequestException, HttpException, Inject } from '@nestjs/common';
import { VeiculoOutput } from '../dto/veiculo.output';
import { InvalidPlacaError, Placa } from '../../domain/value-objects/placa';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

export class FindVeiculoByPlacaUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
  ) {}

  async execute(placaRaw: string): Promise<VeiculoOutput> {
    const placa = this.buildPlaca(placaRaw);
    const veiculo = await this.veiculoRepository.findByPlaca(placa.toString());

    if (!veiculo) {
      throw new HttpException('Veiculo não encontrado.', 404);
    }

    return veiculo;
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
