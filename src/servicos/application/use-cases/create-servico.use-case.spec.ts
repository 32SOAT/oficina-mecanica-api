import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateServicoUseCase } from './create-servico.use-case';
import type { ServicoRepository } from '../ports/servico.repository';

describe('CreateServicoUseCase', () => {
  let useCase: CreateServicoUseCase;
  let servicoRepository: jest.Mocked<
    Pick<ServicoRepository, 'existsByNome' | 'save'>
  >;

  const output = {
    id: 1,
    servico: 'Troca de óleo',
    descricao: 'Troca de óleo e filtro',
    precoMaoDeObra: 150.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    servicoRepository = {
      existsByNome: jest.fn(),
      save: jest.fn(),
    };
    useCase = new CreateServicoUseCase(
      servicoRepository as unknown as ServicoRepository,
    );
  });

  it('creates servico when nome is unique', async () => {
    servicoRepository.existsByNome.mockResolvedValue(false);
    servicoRepository.save.mockResolvedValue(output);

    await expect(
      useCase.execute({
        servico: 'Troca de óleo',
        descricao: 'Troca de óleo e filtro',
        precoMaoDeObra: 150.5,
      }),
    ).resolves.toBe(output);
  });

  it('throws conflict for duplicate nome', async () => {
    servicoRepository.existsByNome.mockResolvedValue(true);
    await expect(
      useCase.execute({
        servico: 'Troca de óleo',
        precoMaoDeObra: 150.5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request for negative price', async () => {
    servicoRepository.existsByNome.mockResolvedValue(false);
    await expect(
      useCase.execute({
        servico: 'Troca de óleo',
        precoMaoDeObra: -50,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
