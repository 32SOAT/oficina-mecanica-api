import {
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CreateServicoInput } from '../dto/create-servico.input';
import { ServicoOutput } from '../dto/servico.output';
import { Servico } from '../../domain/servico';
import { InvalidPrecoMaoDeObraError } from '../../domain/errors/invalid-preco-mao-de-obra.error';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

export class CreateServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(input: CreateServicoInput): Promise<ServicoOutput> {
    if (await this.servicoRepository.existsByNome(input.servico)) {
      throw new ConflictException('Serviço com este nome já existe.');
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
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
