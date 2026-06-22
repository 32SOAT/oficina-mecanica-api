import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { UpdateServicoInput } from '../dto/update-servico.input';
import { InvalidPrecoMaoDeObraError } from '../../domain/errors/invalid-preco-mao-de-obra.error';
import { Servico } from '../../domain/servico';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

@Injectable()
export class UpdateServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number, input: UpdateServicoInput): Promise<Servico> {
    const existing = await this.servicoRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Serviço não encontrado');
    }

    if (input.servico) {
      const duplicate = await this.servicoRepository.existsByNome(
        input.servico,
        id,
      );
      if (duplicate) {
        throw new ConflictError('Serviço com este nome já existe.');
      }
    }

    try {
      const updated = existing.update({
        nome: input.servico,
        descricao: input.descricao,
        precoMaoDeObra: input.precoMaoDeObra,
      });
      return this.servicoRepository.save(updated);
    } catch (error) {
      if (error instanceof InvalidPrecoMaoDeObraError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}
