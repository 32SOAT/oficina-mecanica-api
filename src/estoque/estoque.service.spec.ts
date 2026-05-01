import { ConflictException, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
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

    service = new EstoqueService(
      estoqueRepository as unknown as Repository<EstoqueEntity>,
      new PaginationService(),
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

  it('gives stock write-off successfully', async () => {
    const existing = item({
      quantidadeFisica: 50,
      quantidadeReservada: 10,
    });

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity as EstoqueEntity),
    );

    const result = await service.executarOperacao(1, {
      operacao: TipoOperacaoEstoque.DAR_BAIXA,
      quantidade: 10,
    });

    expect(result.quantidadeFisica).toBe(40);
    expect(result.quantidadeReservada).toBe(0);
  });

  it('rejects write-off when quantity exceeds physical stock', async () => {
    const existing = item({ quantidadeFisica: 5, quantidadeReservada: 0 });

    estoqueRepository.findOneBy.mockResolvedValue(existing);

    await expect(
      service.executarOperacao(1, {
        operacao: TipoOperacaoEstoque.DAR_BAIXA,
        quantidade: 10,
      }),
    ).rejects.toThrow('Quantidade para baixa excede o estoque físico');
  });

  it('soft removes an item', async () => {
    const existing = item();

    estoqueRepository.findOneBy.mockResolvedValue(existing);
    estoqueRepository.softRemove.mockResolvedValue(existing);

    await expect(service.remove(1)).resolves.toBe(existing);
  });
});
