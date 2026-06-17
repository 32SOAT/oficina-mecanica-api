import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OperacaoEstoqueInput } from '../dto/operacao-estoque.input';
import { TipoOperacaoEstoque } from '../dto/tipo-operacao-estoque';
import { EstoqueOutput } from '../dto/estoque.output';
import { EstoqueOperacaoInvalidaError } from '../../domain/errors/estoque-operacao-invalida.error';
import { EstoqueOutputMapper } from '../mappers/estoque-output.mapper';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class ExecutarOperacaoEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(
    id: number,
    input: OperacaoEstoqueInput,
  ): Promise<EstoqueOutput> {
    if (input.operacao === TipoOperacaoEstoque.REPOSICAO) {
      throw new BadRequestException(
        'Operação "reposicao" é tratada no controller.',
      );
    }

    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    let estoque = EstoqueOutputMapper.toDomain(existing);

    try {
      if (input.operacao === TipoOperacaoEstoque.RESERVAR) {
        estoque = estoque.reservar(input.quantidade);
      } else if (input.operacao === TipoOperacaoEstoque.BAIXA) {
        estoque = estoque.darBaixaSomenteDisponivel(input.quantidade);
      } else {
        throw new BadRequestException('Operação de estoque inválida.');
      }
    } catch (error) {
      if (error instanceof EstoqueOperacaoInvalidaError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return this.estoqueRepository.save(estoque);
  }
}
