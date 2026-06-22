import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { RemoveEstoqueUseCase } from './remove-estoque.use-case';
import type { EstoqueRepository } from '../ports/estoque.repository';
import { Estoque } from '../../domain/estoque';

type EstoqueRepositoryMock = jest.Mocked<
  Pick<EstoqueRepository, 'findById' | 'softRemove'>
>;

const makeEstoque = (
  overrides: Partial<ConstructorParameters<typeof Estoque>[0]> = {},
): Estoque =>
  new Estoque({
    id: 1,
    codigo: 'PCA-001',
    pecasInsumos: 'Pastilha de freio',
    quantidadeFisica: 0,
    quantidadeReservada: 0,
    precoUnitario: 89.9,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  });

describe('RemoveEstoqueUseCase', () => {
  let useCase: RemoveEstoqueUseCase;
  let estoqueRepository: EstoqueRepositoryMock;

  beforeEach(() => {
    estoqueRepository = {
      findById: jest.fn(),
      softRemove: jest.fn(),
    };

    useCase = new RemoveEstoqueUseCase(
      estoqueRepository as unknown as EstoqueRepository,
    );
  });

  it('removes item when physical and reserved quantities are zero', async () => {
    const existing = makeEstoque();
    const removed = makeEstoque({
      deletedAt: new Date('2024-01-02'),
    });

    estoqueRepository.findById.mockResolvedValue(existing);
    estoqueRepository.softRemove.mockResolvedValue(removed);

    const result = await useCase.execute(1);

    expect(estoqueRepository.softRemove).toHaveBeenCalledWith(existing);
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('throws BadRequestError when item still has physical quantity', async () => {
    estoqueRepository.findById.mockResolvedValue(
      makeEstoque({ quantidadeFisica: 3 }),
    );

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(BadRequestError);
    expect(estoqueRepository.softRemove).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when item still has reserved quantity', async () => {
    estoqueRepository.findById.mockResolvedValue(
      makeEstoque({
        quantidadeFisica: 0,
        quantidadeReservada: 2,
      }),
    );

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(BadRequestError);
    expect(estoqueRepository.softRemove).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when item does not exist', async () => {
    estoqueRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundError);
  });
});
