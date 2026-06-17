import { HttpException, Inject } from '@nestjs/common';
import { ServicoOutput } from '../dto/servico.output';
import { Servico } from '../../domain/servico';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

export class RemoveServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number): Promise<ServicoOutput> {
    const existing = await this.servicoRepository.findById(id);
    if (!existing) {
      throw new HttpException('Serviço não encontrado', 404);
    }

    const servico = Servico.create({
      id: existing.id,
      nome: existing.servico,
      descricao: existing.descricao,
      precoMaoDeObra: existing.precoMaoDeObra,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      deletedAt: existing.deletedAt,
    });

    return this.servicoRepository.softRemove(servico.softRemove());
  }
}
