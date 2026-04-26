import { ConflictException, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { PecaEntity } from './peca.entity';
import { PecaService } from './peca.service';
import { TipoOperacaoEstoque } from './dtos/update-estoque.dto';

type PecaRepositoryMock = jest.Mocked<
  Pick<
    Repository<PecaEntity>,
    'create' | 'save' | 'findOne' | 'findOneBy' | 'merge' | 'softRemove'
  >
> & {
  createQueryBuilder: jest.Mock;
};

describe('PecaService', () => {
  let service: PecaService;
  let pecaRepository: PecaRepositoryMock;

  const peca = (overrides: Partial<PecaEntity> = {}): PecaEntity => {
    const entity = Object.assign(new PecaEntity(), {
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
    pecaRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock()),
    };

    service = new PecaService(
      pecaRepository as unknown as Repository<PecaEntity>,
      new PaginationService(),
    );
  });

  it('creates a peca with valid data', async () => {
    const createPecaDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };

    const createdPeca = peca();

    pecaRepository.findOne.mockResolvedValue(null);
    pecaRepository.create.mockReturnValue(createdPeca);
    pecaRepository.save.mockResolvedValue(createdPeca);

    await expect(service.create(createPecaDto)).resolves.toBe(createdPeca);
  });

  it('rejects duplicate codigo on create', async () => {
    const createPecaDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };

    pecaRepository.findOne.mockResolvedValue(peca());

    await expect(service.create(createPecaDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists pecas with default pagination', async () => {
    const pecas = [peca()];
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([pecas, 25]);
    pecaRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({});

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(DefaultPageSize.PECA);
    expect(result.meta).toEqual({
      itemsPerPage: DefaultPageSize.PECA,
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
    pecaRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({}, true);

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(estoque.quantidade_fisica - estoque.quantidade_reservada) <= 5',
    );
  });

  it('does not filter estoque baixo when flag is false', async () => {
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    pecaRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({}, false);

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('finds one peca by id', async () => {
    const existingPeca = peca();
    pecaRepository.findOneBy.mockResolvedValue(existingPeca);

    await expect(service.findOne(1)).resolves.toBe(existingPeca);
  });

  it('throws 404 when peca is not found by id', async () => {
    pecaRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(HttpException);
  });

  it('finds one peca by codigo', async () => {
    const existingPeca = peca();
    pecaRepository.findOne.mockResolvedValue(existingPeca);

    await expect(service.findByCodigo('PCA-001')).resolves.toBe(existingPeca);
  });

  it('throws 404 when peca is not found by codigo', async () => {
    pecaRepository.findOne.mockResolvedValue(null);

    await expect(service.findByCodigo('INVALID')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('updates a peca', async () => {
    const existingPeca = peca();
    const updatePecaDto = { pecasInsumos: 'Pastilha de freio cerâmica' };
    const updatedPeca = peca(updatePecaDto);

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);
    pecaRepository.merge.mockReturnValue(updatedPeca);
    pecaRepository.save.mockResolvedValue(updatedPeca);

    await expect(service.update(1, updatePecaDto)).resolves.toBe(updatedPeca);
  });

  it('rejects duplicate codigo on update', async () => {
    const existingPeca = peca();
    const anotherPeca = peca({ id: 2, codigo: 'PCA-002' });

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);
    pecaRepository.findOne.mockResolvedValue(anotherPeca);

    await expect(
      service.update(1, { codigo: 'PCA-002' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reserves stock successfully', async () => {
    const existingPeca = peca({ quantidadeFisica: 50, quantidadeReservada: 5 });

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);
    pecaRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity as PecaEntity),
    );

    const result = await service.updateEstoque(1, {
      operacao: TipoOperacaoEstoque.RESERVAR,
      quantidade: 10,
    });

    expect(result.quantidadeReservada).toBe(15);
  });

  it('rejects reserve when stock is insufficient', async () => {
    const existingPeca = peca({ quantidadeFisica: 10, quantidadeReservada: 8 });

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);

    await expect(
      service.updateEstoque(1, {
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 5,
      }),
    ).rejects.toThrow('Estoque insuficiente');
  });

  it('gives stock write-off successfully', async () => {
    const existingPeca = peca({
      quantidadeFisica: 50,
      quantidadeReservada: 10,
    });

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);
    pecaRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity as PecaEntity),
    );

    const result = await service.updateEstoque(1, {
      operacao: TipoOperacaoEstoque.DAR_BAIXA,
      quantidade: 10,
    });

    expect(result.quantidadeFisica).toBe(40);
    expect(result.quantidadeReservada).toBe(0);
  });

  it('rejects write-off when quantity exceeds physical stock', async () => {
    const existingPeca = peca({ quantidadeFisica: 5, quantidadeReservada: 0 });

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);

    await expect(
      service.updateEstoque(1, {
        operacao: TipoOperacaoEstoque.DAR_BAIXA,
        quantidade: 10,
      }),
    ).rejects.toThrow('Quantidade para baixa excede o estoque físico');
  });

  it('soft removes a peca', async () => {
    const existingPeca = peca();

    pecaRepository.findOneBy.mockResolvedValue(existingPeca);
    pecaRepository.softRemove.mockResolvedValue(existingPeca);

    await expect(service.remove(1)).resolves.toBe(existingPeca);
  });
});
