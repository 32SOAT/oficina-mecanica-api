import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { Servico } from '../../domain/servico';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

@Injectable()
export class RemoveServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number): Promise<Servico> {
    const existing = await this.servicoRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Serviço não encontrado');
    }

    return this.servicoRepository.softRemove(existing.softRemove());
  }
}
