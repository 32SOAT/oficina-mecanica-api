import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { Veiculo } from '../../domain/veiculo';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

@Injectable()
export class RemoveVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
  ) {}

  async execute(id: string): Promise<Veiculo> {
    const existing = await this.veiculoRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Veiculo não encontrado.');
    }

    return this.veiculoRepository.softRemove(existing.softRemove());
  }
}
