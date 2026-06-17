import { HttpException, Inject } from '@nestjs/common';
import { ServicoOutput } from '../dto/servico.output';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

export class FindServicoByIdUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number): Promise<ServicoOutput> {
    const servico = await this.servicoRepository.findById(id);
    if (!servico) {
      throw new HttpException('Serviço não encontrado', 404);
    }
    return servico;
  }
}
