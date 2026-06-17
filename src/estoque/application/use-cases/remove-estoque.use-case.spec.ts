import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RemoveEstoqueUseCase } from './remove-estoque.use-case';
import type { EstoqueRepository } from '../ports/estoque.repository';
import type { EstoqueOutput } from '../dto/estoque.output';

type EstoqueRepositoryMock = jest.Mocked<
  Pick<EstoqueRepository, 'findById' | 'softRemove'>
>;

const makeEstoqueOutput = (
  overrides: Partial<EstoqueOutput> = {},
): EstoqueOutput => ({
  id: 1,
  codigo: 'PCA-001',
  pecasInsumos: 'Pastilha de freio',
  quantidadeFisica: 0,
  quantidadeReservada: 0,
  quantidadeDisponivel: 0,
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
    const existing = makeEstoqueOutput();
    const removed = makeEstoqueOutput({
      deletedAt: new Date('2024-01-02'),
    });

    estoqueRepository.findById.mockResolvedValue(existing);
    estoqueRepository.softRemove.mockResolvedValue(removed);

    const result = await useCase.execute(1);

    expect(estoqueRepository.softRemove).toHaveBeenCalled();
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('throws BadRequestException when item still has physical quantity', async () => {
    estoqueRepository.findById.mockResolvedValue(
      makeEstoqueOutput({ quantidadeFisica: 3, quantidadeDisponivel: 3 }),
    );

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(estoqueRepository.softRemove).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when item still has reserved quantity', async () => {
    estoqueRepository.findById.mockResolvedValue(
      makeEstoqueOutput({
        quantidadeFisica: 0,
        quantidadeReservada: 2,
        quantidadeDisponivel: -2,
      }),
    );

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(estoqueRepository.softRemove).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when item does not exist', async () => {
    estoqueRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
