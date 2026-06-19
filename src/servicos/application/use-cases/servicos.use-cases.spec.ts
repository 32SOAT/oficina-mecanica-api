import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { FindAllServicosUseCase } from './find-all-servicos.use-case';
import { FindServicoByIdUseCase } from './find-servico-by-id.use-case';
import { UpdateServicoUseCase } from './update-servico.use-case';
import { RemoveServicoUseCase } from './remove-servico.use-case';
import type { ServicoRepository } from '../ports/servico.repository';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { Servico } from '../../domain/servico';

const makeServico = (
  overrides: Partial<ConstructorParameters<typeof Servico.create>[0]> = {},
): Servico =>
  Servico.create({
    id: 1,
    nome: 'Troca de óleo',
    descricao: 'Completa',
    precoMaoDeObra: 150,
    ...overrides,
  });

describe('Servico use cases', () => {
  describe('FindAllServicosUseCase', () => {
    const servicoRepository = { findAll: jest.fn() };
    const useCase = new FindAllServicosUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('returns paginated servicos', async () => {
      const servico = makeServico();
      servicoRepository.findAll.mockResolvedValue([[servico], 1]);
      const result = await useCase.execute({ page: 1, take: 10 });
      expect(servicoRepository.findAll).toHaveBeenCalledWith(0, 10);
      expect(result.data).toHaveLength(1);
    });

    it('uses defaults', async () => {
      servicoRepository.findAll.mockResolvedValue([[], 0]);
      await useCase.execute({});
      expect(servicoRepository.findAll).toHaveBeenCalledWith(
        0,
        DEFAULT_PAGE_SIZE,
      );
    });
  });

  describe('FindServicoByIdUseCase', () => {
    const servicoRepository = { findById: jest.fn() };
    const useCase = new FindServicoByIdUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('returns servico', async () => {
      const servico = makeServico();
      servicoRepository.findById.mockResolvedValue(servico);
      await expect(useCase.execute(1)).resolves.toEqual(servico);
    });

    it('throws NotFoundError when not found', async () => {
      servicoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('UpdateServicoUseCase', () => {
    const servicoRepository = {
      findById: jest.fn(),
      existsByNome: jest.fn(),
      save: jest.fn(),
    };
    const useCase = new UpdateServicoUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('updates servico', async () => {
      const existing = makeServico();
      const updated = makeServico({ descricao: 'Nova' });
      servicoRepository.findById.mockResolvedValue(existing);
      servicoRepository.existsByNome.mockResolvedValue(false);
      servicoRepository.save.mockResolvedValue(updated);

      const result = await useCase.execute(1, { descricao: 'Nova' });
      expect(result.descricao).toBe('Nova');
    });

    it('throws ConflictError for duplicate nome', async () => {
      servicoRepository.findById.mockResolvedValue(makeServico());
      servicoRepository.existsByNome.mockResolvedValue(true);
      await expect(
        useCase.execute(1, { servico: 'Outro' }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('throws BadRequestError for invalid preco', async () => {
      servicoRepository.findById.mockResolvedValue(makeServico());
      await expect(
        useCase.execute(1, { precoMaoDeObra: -1 }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe('RemoveServicoUseCase', () => {
    const servicoRepository = { findById: jest.fn(), softRemove: jest.fn() };
    const useCase = new RemoveServicoUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('removes servico', async () => {
      const existing = makeServico();
      const removed = makeServico({ deletedAt: new Date() });
      servicoRepository.findById.mockResolvedValue(existing);
      servicoRepository.softRemove.mockResolvedValue(removed);
      const result = await useCase.execute(1);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundError when not found', async () => {
      servicoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
