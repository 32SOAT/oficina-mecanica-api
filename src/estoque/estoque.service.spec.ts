import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import type { OrdemServicoService } from '../ordens-de-servico/ordem-servico.service';
import { EstoqueEntity } from './estoque.entity';
import { EstoqueService } from './estoque.service';
import { TipoOperacaoEstoque } from './dtos/operacao-estoque.dto';

type EstoqueRepositoryMock = jest.Mocked<
  Pick<
    Repository<EstoqueEntity>,
    'create' | 'save' | 'findOne' | 'findOneBy' | 'merge' | 'softRemove'
  >
> & {
  createQueryBuilder: jest.Mock;
};

describe('EstoqueService', () => {
  let service: EstoqueService;
  let estoqueRepository: EstoqueRepositoryMock;
  let ordemServicoService: jest.Mocked<
    Pick<OrdemServicoService, 'tentarLiberarOsAposReposicaoEstoque'>
  >;

  const item = (overrides: Partial<EstoqueEntity> = {}): EstoqueEntity => {
    const entity = Object.assign(new EstoqueEntity(), {
      id: 1,
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      quantidadeReservada: 5,
      precoUnitario: 89.9,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    });
    return entity;
  };

  const createQueryBuilderMock = () => {
    const mock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return mock;
  };

  beforeEach(() => {
    estoqueRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock()),
    };

    ordemServicoService = {
      tentarLiberarOsAposReposicaoEstoque: jest.fn().mockResolvedValue(undefined),
    };

    service = new EstoqueService(
      estoqueRepository as unknown as Repository<EstoqueEntity>,
      new PaginationService(),
      ordemServicoService as unknown as OrdemServicoService,
    );
  });

  it('creates an estoque item with valid data', async () => {
    const createEstoqueDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };

    const created = item();

    estoqueRepository.findOne.mockResolvedValue(null);
    estoqueRepository.create.mockReturnValue(created);
    estoqueRepository.save.mockResolvedValue(created);

    await expect(service.create(createEstoqueDto)).resolves.toBe(created);
    expect(
      ordemServicoService.tentarLiberarOsAposReposicaoEstoque,
    ).toHaveBeenCalledWith([created.id], null);
  });

  it('rejects duplicate codigo on create', async () => {
    const createEstoqueDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };

    estoqueRepository.findOne.mockResolvedValue(item());

    await expect(service.create(createEstoqueDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists items with default pagination', async () => {
    const items = [item()];
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([items, 25]);
    estoqueRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({});

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(DefaultPageSize.ESTOQUE);
    expect(result.meta).toEqual({
      itemsPerPage: DefaultPageSize.ESTOQUE,
      totalItems: 25,
      currentPage: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('filters by estoque baixo when flag is true', async () => {
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    estoqueRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({}, true);

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(estoque.quantidade_fisica - estoque.quantidade_reservada) <= 5',
    );
  });

  it('does not filter estoque baixo when flag is false', async () => {
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    estoqueRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({}, false);

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('finds one item by id', async () => {
    const existing = item();
    estoqueRepository.findOneBy.mockResolvedValue(existing);

    await expect(service.findOne(1)).resolves.toBe(existing);
  });

  it('throws 404 when item is not found by id', async () => {
    estoqueRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(HttpException);
  });

  it('finds one item by codigo', async () => {
    const existing = item();
    estoqueRepository.findOne.mockResolvedValue(existing);

    await expect(service.findByCodigo('PCA-001')).resolves.toBe(existing);
  });

  it('throws 404 when item is not found by codigo', async () => {
    estoqueRepository.findOne.mockResolvedValue(null);

    await expect(service.findByCodigo('INVALID')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('updates an item', async () => {
    const existing = item();
    const updateEstoqueDto = { pecasInsumos: 'Pastilha de freio cerâmica' };
    const updated = item(updateEstoqueDto);

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.merge.mockReturnValue(updated);
    estoqueRepository.save.mockResolvedValue(updated);

    await expect(service.update(1, updateEstoqueDto)).resolves.toBe(updated);
    expect(
      ordemServicoService.tentarLiberarOsAposReposicaoEstoque,
    ).not.toHaveBeenCalled();
  });

  it('update não dispara tentativa de liberar OS', async () => {
    const existing = item({ quantidadeFisica: 10 });
    const updated = item({ quantidadeFisica: 10, pecasInsumos: 'Só mudou nome' });
    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.merge.mockReturnValue(updated);
    estoqueRepository.save.mockResolvedValue(updated);

    await service.update(1, { pecasInsumos: 'Só mudou nome' });

    expect(
      ordemServicoService.tentarLiberarOsAposReposicaoEstoque,
    ).not.toHaveBeenCalled();
  });

  it('rejects duplicate codigo on update', async () => {
    const existing = item();
    const another = item({ id: 2, codigo: 'PCA-002' });

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.findOne.mockResolvedValue(another);

    await expect(
      service.update(1, { codigo: 'PCA-002' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows codigo update when no other item holds the new code', async () => {
    const existing = item({ codigo: 'PCA-OLD' });
    const updated = item({ codigo: 'PCA-RARE', pecasInsumos: existing.pecasInsumos });

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.findOne.mockResolvedValueOnce(null);
    estoqueRepository.merge.mockReturnValue(updated);
    estoqueRepository.save.mockResolvedValue(updated);

    await expect(
      service.update(1, { codigo: 'PCA-RARE' }),
    ).resolves.toBe(updated);
  });

  it('skip duplicate check when codigo in update equals current codigo', async () => {
    const existing = item({ codigo: 'PCA-SAME', quantidadeFisica: 4 });
    const updated = item({ codigo: 'PCA-SAME', pecasInsumos: 'Só nome' });
    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.merge.mockReturnValue(updated);
    estoqueRepository.save.mockResolvedValue(updated);

    await expect(
      service.update(1, { codigo: 'PCA-SAME', pecasInsumos: 'Só nome' }),
    ).resolves.toBe(updated);
    expect(estoqueRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejeita executarOperacao quando operação é reposicao (reservado ao controller)', async () => {
    await expect(
      service.executarOperacao(1, {
        operacao: TipoOperacaoEstoque.REPOSICAO,
        quantidade: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reserves stock successfully', async () => {
    const existing = item({ quantidadeFisica: 50, quantidadeReservada: 5 });

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity as EstoqueEntity),
    );

    const result = await service.executarOperacao(1, {
      operacao: TipoOperacaoEstoque.RESERVAR,
      quantidade: 10,
    });

    expect(result.quantidadeReservada).toBe(15);
  });

  it('rejects reserve when stock is insufficient', async () => {
    const existing = item({ quantidadeFisica: 10, quantidadeReservada: 8 });

    estoqueRepository.findOneBy.mockResolvedValue(existing);

    await expect(
      service.executarOperacao(1, {
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 5,
      }),
    ).rejects.toThrow('Estoque insuficiente');
  });


  it('soft removes an item', async () => {
    const existing = item();

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.softRemove.mockResolvedValue(existing);

    await expect(service.remove(1)).resolves.toBe(existing);
  });

  it('registrarReposicaoEstoque passa usuarioId null quando omitido', async () => {
    const base = item({ quantidadeFisica: 5 });
    const after = item({ quantidadeFisica: 8 });
    estoqueRepository.findOneBy.mockResolvedValue(base);
    estoqueRepository.save.mockResolvedValue(after);

    await service.registrarReposicaoEstoque(1, { quantidade: 3 });

    expect(
      ordemServicoService.tentarLiberarOsAposReposicaoEstoque,
    ).toHaveBeenCalledWith([1], null);
  });

  it('registrarReposicaoEstoque soma física e tenta liberar OS com usuarioId', async () => {
    const base = item({ quantidadeFisica: 10 });
    const after = Object.assign(new EstoqueEntity(), {
      ...base,
      quantidadeFisica: 25,
    });
    estoqueRepository.findOneBy.mockResolvedValue(base);
    estoqueRepository.save.mockResolvedValue(after);

    await expect(
      service.registrarReposicaoEstoque(1, { quantidade: 15 }, 'admin-uuid'),
    ).resolves.toBe(after);

    expect(base.quantidadeFisica).toBe(25);
    expect(
      ordemServicoService.tentarLiberarOsAposReposicaoEstoque,
    ).toHaveBeenCalledWith([1], 'admin-uuid');
  });
});
