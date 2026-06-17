import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
} from '@nestjs/common';
import { UpdateServicoInput } from '../dto/update-servico.input';
import { ServicoOutput } from '../dto/servico.output';
import { Servico } from '../../domain/servico';
import { InvalidPrecoMaoDeObraError } from '../../domain/errors/invalid-preco-mao-de-obra.error';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

export class UpdateServicoUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(id: number, input: UpdateServicoInput): Promise<ServicoOutput> {
    const existing = await this.servicoRepository.findById(id);
    if (!existing) {
      throw new HttpException('Serviço não encontrado', 404);
    }

    if (input.servico) {
      const duplicate = await this.servicoRepository.existsByNome(
        input.servico,
        id,
      );
      if (duplicate) {
        throw new ConflictException('Serviço com este nome já existe.');
      }
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

    try {
      const updated = servico.update({
        nome: input.servico,
        descricao: input.descricao,
        precoMaoDeObra: input.precoMaoDeObra,
      });
      return this.servicoRepository.save(updated);
    } catch (error) {
      if (error instanceof InvalidPrecoMaoDeObraError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
