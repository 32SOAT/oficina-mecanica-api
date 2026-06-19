import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { Servico } from '../../domain/servico';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

@Injectable()
export class FindServicoByIdUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number): Promise<Servico> {
    const servico = await this.servicoRepository.findById(id);
    if (!servico) {
      throw new NotFoundError('Serviço não encontrado');
    }
    return servico;
  }
}
