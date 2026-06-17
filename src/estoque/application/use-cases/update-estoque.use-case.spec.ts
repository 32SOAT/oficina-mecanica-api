import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateEstoqueUseCase } from './update-estoque.use-case';
import type { EstoqueRepository } from '../ports/estoque.repository';
import type { EstoqueOutput } from '../dto/estoque.output';
import type { UpdateEstoqueInput } from '../dto/update-estoque.input';

type EstoqueRepositoryMock = jest.Mocked<
  Pick<EstoqueRepository, 'findById' | 'existsByCodigo' | 'save'>
>;

const makeEstoqueOutput = (overrides: Partial<EstoqueOutput> = {}): EstoqueOutput => ({
  id: 1,
  codigo: 'PCA-001',
  pecasInsumos: 'Pastilha de freio',
  quantidadeFisica: 10,
  quantidadeReservada: 0,
  quantidadeDisponivel: 10,
  precoUnitario: 89.9,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

describe('UpdateEstoqueUseCase', () => {
  let useCase: UpdateEstoqueUseCase;
  let estoqueRepository: EstoqueRepositoryMock;

  beforeEach(() => {
    estoqueRepository = {
      findById: jest.fn(),
      existsByCodigo: jest.fn(),
      save: jest.fn(),
    };

    useCase = new UpdateEstoqueUseCase(
      estoqueRepository as unknown as EstoqueRepository,
    );
  });

  it('updates cadastro when codigo is unique', async () => {
    const existing = makeEstoqueOutput({ id: 7, codigo: 'PCA-007' });
    const input: UpdateEstoqueInput = {
      codigo: 'PCA-010',
      precoUnitario: 99.9,
    };

    estoqueRepository.findById.mockResolvedValue(existing);
    estoqueRepository.existsByCodigo.mockResolvedValue(false);
    estoqueRepository.save.mockImplementation(async (estoque) => ({
      ...existing,
      codigo: estoque.codigo,
      pecasInsumos: estoque.pecasInsumos,
      precoUnitario: estoque.precoUnitario,
      updatedAt: estoque.updatedAt,
    }));

    const result = await useCase.execute(7, input);

    expect(estoqueRepository.existsByCodigo).toHaveBeenCalledWith('PCA-010', 7);
    expect(result.codigo).toBe('PCA-010');
    expect(result.precoUnitario).toBe(99.9);
  });

  it('skips codigo check when codigo is unchanged', async () => {
    const existing = makeEstoqueOutput({ id: 7 });
    const input: UpdateEstoqueInput = { precoUnitario: 75 };

    estoqueRepository.findById.mockResolvedValue(existing);
    estoqueRepository.save.mockImplementation(async (estoque) => ({
      ...existing,
      precoUnitario: estoque.precoUnitario,
    }));

    await useCase.execute(7, input);

    expect(estoqueRepository.existsByCodigo).not.toHaveBeenCalled();
  });

  it('throws ConflictException when codigo is already in use', async () => {
    const existing = makeEstoqueOutput({ id: 7, codigo: 'PCA-007' });

    estoqueRepository.findById.mockResolvedValue(existing);
    estoqueRepository.existsByCodigo.mockResolvedValue(true);

    await expect(
      useCase.execute(7, { codigo: 'PCA-003' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(estoqueRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when item does not exist', async () => {
    estoqueRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(99, { codigo: 'PCA-003' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
