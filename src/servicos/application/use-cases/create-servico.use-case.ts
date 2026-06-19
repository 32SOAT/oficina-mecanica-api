import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
} from '../../../common/application/errors/application.errors';
import { CreateServicoInput } from '../dto/create-servico.input';
import { Servico } from '../../domain/servico';
import { InvalidPrecoMaoDeObraError } from '../../domain/errors/invalid-preco-mao-de-obra.error';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

@Injectable()
export class CreateServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(input: CreateServicoInput): Promise<Servico> {
    if (await this.servicoRepository.existsByNome(input.servico)) {
      throw new ConflictError('Serviço com este nome já existe.');
    }

    const servico = this.buildServico(input);
    return this.servicoRepository.save(servico);
  }

  private buildServico(input: CreateServicoInput): Servico {
    try {
      return Servico.create({
        nome: input.servico,
        descricao: input.descricao,
        precoMaoDeObra: input.precoMaoDeObra,
      });
    } catch (error) {
      if (error instanceof InvalidPrecoMaoDeObraError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}
