import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstoqueOutput } from '../dto/estoque.output';
import { EstoqueOperacaoInvalidaError } from '../../domain/errors/estoque-operacao-invalida.error';
import { EstoqueOutputMapper } from '../mappers/estoque-output.mapper';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class RemoveEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number): Promise<EstoqueOutput> {
    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    const estoque = EstoqueOutputMapper.toDomain(existing);

    try {
      estoque.assertRemovivel();
    } catch (error) {
      if (error instanceof EstoqueOperacaoInvalidaError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return this.estoqueRepository.softRemove(estoque);
  }
}
