import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { CreateEstoqueUseCase } from './create-estoque.use-case';
import { FindAllEstoquesUseCase } from './find-all-estoques.use-case';
import { FindEstoqueByIdUseCase } from './find-estoque-by-id.use-case';
import { ExecutarOperacaoEstoqueUseCase } from './executar-operacao-estoque.use-case';
import { RegistrarReposicaoEstoqueUseCase } from './registrar-reposicao-estoque.use-case';
import type { EstoqueRepository } from '../ports/estoque.repository';
import type { OrdemServicoReposicaoPort } from '../ports/ordem-servico-reposicao.port';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { TipoOperacaoEstoque } from '../dto/tipo-operacao-estoque';
import { Estoque } from '../../domain/estoque';

const makeEstoque = (
  overrides: Partial<ConstructorParameters<typeof Estoque>[0]> = {},
): Estoque =>
  new Estoque({
    id: 1,
    codigo: 'PCA-001',
    pecasInsumos: 'Pastilha',
    quantidadeFisica: 10,
    quantidadeReservada: 0,
    precoUnitario: 89.9,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

describe('Estoque use cases', () => {
  describe('CreateEstoqueUseCase', () => {
    const estoqueRepository = {
      existsByCodigo: jest.fn(),
      save: jest.fn(),
    };
    const ordemServicoReposicaoPort = {
      tentarLiberarOsAposReposicao: jest.fn(),
    };
    const useCase = new CreateEstoqueUseCase(
      estoqueRepository as unknown as EstoqueRepository,
      ordemServicoReposicaoPort as unknown as OrdemServicoReposicaoPort,
    );

    it('creates estoque when codigo is unique', async () => {
      const saved = makeEstoque();
      estoqueRepository.existsByCodigo.mockResolvedValue(false);
      estoqueRepository.save.mockResolvedValue(saved);
      ordemServicoReposicaoPort.tentarLiberarOsAposReposicao.mockResolvedValue(
        undefined,
      );

      const result = await useCase.execute({
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha',
        quantidadeFisica: 10,
        precoUnitario: 89.9,
      });

      expect(result).toEqual(saved);
      expect(
        ordemServicoReposicaoPort.tentarLiberarOsAposReposicao,
      ).toHaveBeenCalledWith([saved.id], null);
    });

    it('throws when codigo exists', async () => {
      estoqueRepository.existsByCodigo.mockResolvedValue(true);
      await expect(
        useCase.execute({
          codigo: 'PCA-001',
          pecasInsumos: 'Pastilha',
          quantidadeFisica: 10,
          precoUnitario: 89.9,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('FindAllEstoquesUseCase', () => {
    const estoqueRepository = { findAll: jest.fn() };
    const useCase = new FindAllEstoquesUseCase(
      estoqueRepository as unknown as EstoqueRepository,
    );

    it('returns paginated estoque', async () => {
      const item = makeEstoque();
      estoqueRepository.findAll.mockResolvedValue([[item], 1]);
      const result = await useCase.execute({ page: 1, take: 10 });
      expect(estoqueRepository.findAll).toHaveBeenCalledWith(0, 10, undefined);
      expect(result.data).toHaveLength(1);
    });

    it('uses defaults', async () => {
      estoqueRepository.findAll.mockResolvedValue([[], 0]);
      await useCase.execute({});
      expect(estoqueRepository.findAll).toHaveBeenCalledWith(
        0,
        DEFAULT_PAGE_SIZE,
        undefined,
      );
    });
  });

  describe('FindEstoqueByIdUseCase', () => {
    const estoqueRepository = { findById: jest.fn() };
    const useCase = new FindEstoqueByIdUseCase(
      estoqueRepository as unknown as EstoqueRepository,
    );

    it('returns item when found', async () => {
      const item = makeEstoque();
      estoqueRepository.findById.mockResolvedValue(item);
      await expect(useCase.execute(1)).resolves.toEqual(item);
    });

    it('throws when not found', async () => {
      estoqueRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('ExecutarOperacaoEstoqueUseCase', () => {
    const estoqueRepository = { findById: jest.fn(), save: jest.fn() };
    const useCase = new ExecutarOperacaoEstoqueUseCase(
      estoqueRepository as unknown as EstoqueRepository,
    );

    it('rejects reposicao operation', async () => {
      await expect(
        useCase.execute(1, {
          operacao: TipoOperacaoEstoque.REPOSICAO,
          quantidade: 1,
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('throws when item not found', async () => {
      estoqueRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute(99, {
          operacao: TipoOperacaoEstoque.RESERVAR,
          quantidade: 1,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('reserves stock', async () => {
      const existing = makeEstoque();
      estoqueRepository.findById.mockResolvedValue(existing);
      estoqueRepository.save.mockImplementation(async (item) => item);

      const result = await useCase.execute(1, {
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 2,
      });

      expect(result.quantidadeReservada).toBe(2);
    });

    it('performs baixa operation', async () => {
      const existing = makeEstoque();
      estoqueRepository.findById.mockResolvedValue(existing);
      estoqueRepository.save.mockImplementation(async (item) => item);

      const result = await useCase.execute(1, {
        operacao: TipoOperacaoEstoque.BAIXA,
        quantidade: 2,
      });

      expect(result.quantidadeFisica).toBe(8);
    });

    it('rejects invalid operation', async () => {
      estoqueRepository.findById.mockResolvedValue(makeEstoque());
      await expect(
        useCase.execute(1, {
          operacao: 'invalid' as TipoOperacaoEstoque,
          quantidade: 1,
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('maps domain errors to bad request', async () => {
      estoqueRepository.findById.mockResolvedValue(
        makeEstoque({
          quantidadeFisica: 1,
          quantidadeReservada: 1,
        }),
      );

      await expect(
        useCase.execute(1, {
          operacao: TipoOperacaoEstoque.RESERVAR,
          quantidade: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe('RegistrarReposicaoEstoqueUseCase', () => {
    const estoqueRepository = { findById: jest.fn(), save: jest.fn() };
    const ordemServicoReposicaoPort = {
      tentarLiberarOsAposReposicao: jest.fn(),
    };
    const useCase = new RegistrarReposicaoEstoqueUseCase(
      estoqueRepository as unknown as EstoqueRepository,
      ordemServicoReposicaoPort as unknown as OrdemServicoReposicaoPort,
    );

    it('throws when item not found', async () => {
      estoqueRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute(99, { quantidade: 5, usuarioId: 'user-id' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('registers reposicao', async () => {
      const existing = makeEstoque();
      const updated = makeEstoque({ quantidadeFisica: 15 });
      estoqueRepository.findById.mockResolvedValue(existing);
      estoqueRepository.save.mockResolvedValue(updated);
      ordemServicoReposicaoPort.tentarLiberarOsAposReposicao.mockResolvedValue(
        undefined,
      );

      const result = await useCase.execute(1, {
        quantidade: 5,
        usuarioId: 'user-id',
      });

      expect(result.quantidadeFisica).toBe(15);
      expect(
        ordemServicoReposicaoPort.tentarLiberarOsAposReposicao,
      ).toHaveBeenCalledWith([1], 'user-id');
    });

    it('registers reposicao with null usuarioId', async () => {
      const existing = makeEstoque();
      const updated = makeEstoque({ quantidadeFisica: 15 });
      estoqueRepository.findById.mockResolvedValue(existing);
      estoqueRepository.save.mockResolvedValue(updated);

      await useCase.execute(1, { quantidade: 5, usuarioId: undefined });

      expect(
        ordemServicoReposicaoPort.tentarLiberarOsAposReposicao,
      ).toHaveBeenCalledWith([1], null);
    });
  });
});
