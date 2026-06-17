import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EstoqueOutput } from '../dto/estoque.output';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class FindEstoqueByIdUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number): Promise<EstoqueOutput> {
    const estoque = await this.estoqueRepository.findById(id);
    if (!estoque) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }
    return estoque;
  }
}
