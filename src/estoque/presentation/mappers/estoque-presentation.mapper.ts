import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateEstoqueInput } from '../../application/dto/create-estoque.input';
import { FindAllEstoquesInput } from '../../application/dto/find-all-estoques.input';
import { OperacaoEstoqueInput } from '../../application/dto/operacao-estoque.input';
import { ReposicaoEstoqueInput } from '../../application/dto/reposicao-estoque.input';
import { UpdateEstoqueInput } from '../../application/dto/update-estoque.input';
import { CreateEstoqueDto } from '../dto/create-estoque.dto';
import { OperacaoEstoqueDto } from '../dto/operacao-estoque.dto';
import { UpdateEstoqueDto } from '../dto/update-estoque.dto';

export class EstoquePresentationMapper {
  static toCreateInput(dto: CreateEstoqueDto): CreateEstoqueInput {
    return {
      codigo: dto.codigo,
      pecasInsumos: dto.pecasInsumos,
      quantidadeFisica: dto.quantidadeFisica,
      precoUnitario: dto.precoUnitario,
    };
  }

  static toUpdateInput(dto: UpdateEstoqueDto): UpdateEstoqueInput {
    return {
      codigo: dto.codigo,
      pecasInsumos: dto.pecasInsumos,
      precoUnitario: dto.precoUnitario,
    };
  }

  static toFindAllInput(
    pagination: PaginationDto,
    estoqueBaixo?: boolean,
  ): FindAllEstoquesInput {
    return {
      page: pagination.page,
      take: pagination.take,
      estoqueBaixo,
    };
  }

  static toOperacaoInput(dto: OperacaoEstoqueDto): OperacaoEstoqueInput {
    return {
      operacao: dto.operacao,
      quantidade: dto.quantidade,
    };
  }

  static toReposicaoInput(
    quantidade: number,
    usuarioId?: string | null,
  ): ReposicaoEstoqueInput {
    return { quantidade, usuarioId };
  }
}
