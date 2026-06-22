import { Inject, Injectable } from '@nestjs/common';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { Estoque } from '../../domain/estoque';
import { EstoqueOperacaoInvalidaError } from '../../domain/errors/estoque-operacao-invalida.error';
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

  async execute(id: number): Promise<Estoque> {
    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item de estoque não encontrado.');
    }

    try {
      existing.assertRemovivel();
    } catch (error) {
      if (error instanceof EstoqueOperacaoInvalidaError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    return this.estoqueRepository.softRemove(existing);
  }
}
