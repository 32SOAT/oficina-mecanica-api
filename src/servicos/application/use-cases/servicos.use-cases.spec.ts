import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { FindAllServicosUseCase } from './find-all-servicos.use-case';
import { FindServicoByIdUseCase } from './find-servico-by-id.use-case';
import { UpdateServicoUseCase } from './update-servico.use-case';
import { RemoveServicoUseCase } from './remove-servico.use-case';
import type { ServicoRepository } from '../ports/servico.repository';
import { DEFAULT_PAGE_SIZE } from '../constants';

const output = {
  id: 1,
  servico: 'Troca de óleo',
  descricao: 'Completa',
  precoMaoDeObra: 150,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('Servico use cases', () => {
  describe('FindAllServicosUseCase', () => {
    const servicoRepository = { findAll: jest.fn() };
    const useCase = new FindAllServicosUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('returns paginated servicos', async () => {
      servicoRepository.findAll.mockResolvedValue([[output], 1]);
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
      servicoRepository.findById.mockResolvedValue(output);
      await expect(useCase.execute(1)).resolves.toEqual(output);
    });

    it('throws when not found', async () => {
      servicoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(99)).rejects.toBeInstanceOf(HttpException);
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
      servicoRepository.findById.mockResolvedValue(output);
      servicoRepository.existsByNome.mockResolvedValue(false);
      servicoRepository.save.mockResolvedValue({
        ...output,
        descricao: 'Nova',
      });

      const result = await useCase.execute(1, { descricao: 'Nova' });
      expect(result.descricao).toBe('Nova');
    });

    it('throws conflict for duplicate nome', async () => {
      servicoRepository.findById.mockResolvedValue(output);
      servicoRepository.existsByNome.mockResolvedValue(true);
      await expect(
        useCase.execute(1, { servico: 'Outro' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws bad request for invalid preco', async () => {
      servicoRepository.findById.mockResolvedValue(output);
      await expect(
        useCase.execute(1, { precoMaoDeObra: -1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('RemoveServicoUseCase', () => {
    const servicoRepository = { findById: jest.fn(), softRemove: jest.fn() };
    const useCase = new RemoveServicoUseCase(
      servicoRepository as unknown as ServicoRepository,
    );

    it('removes servico', async () => {
      servicoRepository.findById.mockResolvedValue(output);
      servicoRepository.softRemove.mockResolvedValue({
        ...output,
        deletedAt: new Date(),
      });
      const result = await useCase.execute(1);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws when not found', async () => {
      servicoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute(99)).rejects.toBeInstanceOf(HttpException);
    });
  });
});
