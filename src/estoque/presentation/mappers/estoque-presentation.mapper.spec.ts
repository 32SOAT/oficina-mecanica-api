import { EstoquePresentationMapper } from './estoque-presentation.mapper';
import { TipoOperacaoEstoque } from '../../application/dto/tipo-operacao-estoque';

describe('EstoquePresentationMapper', () => {
  it('maps create dto', () => {
    expect(
      EstoquePresentationMapper.toCreateInput({
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha',
        quantidadeFisica: 10,
        precoUnitario: 89.9,
      }),
    ).toEqual({
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha',
      quantidadeFisica: 10,
      precoUnitario: 89.9,
    });
  });

  it('maps update dto', () => {
    expect(
      EstoquePresentationMapper.toUpdateInput({
        codigo: 'PCA-002',
        precoUnitario: 99.9,
      }),
    ).toEqual({
      codigo: 'PCA-002',
      pecasInsumos: undefined,
      precoUnitario: 99.9,
    });
  });

  it('maps find all input', () => {
    expect(
      EstoquePresentationMapper.toFindAllInput({ page: 2, take: 20 }, true),
    ).toEqual({ page: 2, take: 20, estoqueBaixo: true });
  });

  it('maps operacao input', () => {
    expect(
      EstoquePresentationMapper.toOperacaoInput({
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 3,
      }),
    ).toEqual({
      operacao: TipoOperacaoEstoque.RESERVAR,
      quantidade: 3,
    });
  });

  it('maps reposicao input', () => {
    expect(EstoquePresentationMapper.toReposicaoInput(5, 'user-id')).toEqual({
      quantidade: 5,
      usuarioId: 'user-id',
    });
  });
});
