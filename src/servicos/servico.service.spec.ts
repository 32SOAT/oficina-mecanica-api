import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { ServicoEntity } from './servico.entity';
import { ServicoService } from './servico.service';
import { UpdateServicoDto } from './dtos/update-servico.dto';

type ServicoRepositoryMock = jest.Mocked<
  Pick<
    Repository<ServicoEntity>,
    'create' | 'save' | 'findAndCount' | 'findOneBy' | 'merge' | 'softRemove'
  >
> & {
  createQueryBuilder: jest.MockedFunction<
    () => SelectQueryBuilder<ServicoEntity>
  >;
};

describe('ServicoService', () => {
  let service: ServicoService;
  let servicoRepository: ServicoRepositoryMock;

  const servico = (overrides: Partial<ServicoEntity> = {}): ServicoEntity => ({
    id: 1,
    servico: 'Troca de óleo',
    descricao: 'Troca de óleo e filtro',
    precoMaoDeObra: 150.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const createQueryBuilderMock = (
    value?: unknown,
  ): SelectQueryBuilder<ServicoEntity> => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ServicoEntity>['where']
      >,
      andWhere: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ServicoEntity>['andWhere']
      >,
      getOne: jest.fn().mockResolvedValue(value),
    } as unknown as SelectQueryBuilder<ServicoEntity>;

    return queryBuilder;
  };

  beforeEach(() => {
    servicoRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    service = new ServicoService(servicoRepository, new PaginationService());
  });

  it('creates a servico with valid data', async () => {
    const createServicoDto = {
      servico: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      precoMaoDeObra: 150.5,
    };

    const createdServico = servico();

    const queryBuilderMock = createQueryBuilderMock(null);

    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    servicoRepository.create.mockReturnValue(createdServico);
    servicoRepository.save.mockResolvedValue(createdServico);

    await expect(service.create(createServicoDto)).resolves.toBe(
      createdServico,
    );
  });

  it('rejects duplicate servico name on create', async () => {
    const createServicoDto = {
      servico: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      precoMaoDeObra: 150.5,
    };

    const queryBuilderMock = createQueryBuilderMock(servico());

    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(service.create(createServicoDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects negative price on create', async () => {
    const createServicoDto = {
      servico: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      precoMaoDeObra: -50,
    };

    const queryBuilderMock = createQueryBuilderMock(null);
    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(service.create(createServicoDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists servicos with pagination', async () => {
    const paginationDto = {
      page: 1,
      take: 10,
    };
    const servicos = [servico()];

    servicoRepository.findAndCount.mockResolvedValue([servicos, 1]);

    const result = await service.findAll(paginationDto);

    expect(result.data).toEqual(servicos);
    expect(result.meta).toBeDefined();
    expect(result.meta.currentPage).toBe(1);
  });

  it('finds one servico by id', async () => {
    const existingServico = servico();
    servicoRepository.findOneBy.mockResolvedValue(existingServico);

    await expect(service.findOne(1)).resolves.toBe(existingServico);
    expect(servicoRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('throws 404 when servico not found by id', async () => {
    servicoRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(HttpException);
  });

  it('updates a servico', async () => {
    const existingServico = servico();
    const updateServicoDto: UpdateServicoDto = {
      descricao: 'Nova descrição',
    };

    const updatedServico = servico(updateServicoDto);

    servicoRepository.findOneBy.mockResolvedValue(existingServico);
    servicoRepository.merge.mockReturnValue(updatedServico);
    servicoRepository.save.mockResolvedValue(updatedServico);

    await expect(
      service.update(existingServico.id, updateServicoDto),
    ).resolves.toBe(updatedServico);
  });

  it('rejects update when new servico name is duplicate', async () => {
    const existingServico = servico();
    const anotherServico = servico({ id: 2, servico: 'Outro serviço' });

    const updateServicoDto: UpdateServicoDto = {
      servico: 'Outro serviço',
    };

    const queryBuilderMock = createQueryBuilderMock(anotherServico);

    servicoRepository.findOneBy.mockResolvedValue(existingServico);
    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(
      service.update(existingServico.id, updateServicoDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects update with negative price', async () => {
    const existingServico = servico();

    const updateServicoDto: UpdateServicoDto = {
      precoMaoDeObra: -100,
    };

    servicoRepository.findOneBy.mockResolvedValue(existingServico);

    await expect(
      service.update(existingServico.id, updateServicoDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates servico with a new unique name', async () => {
    const existingServico = servico();
    const updatedServico = servico({ servico: 'Novo serviço' });
    const updateServicoDto: UpdateServicoDto = {
      servico: 'Novo serviço',
    };

    const queryBuilderMock = createQueryBuilderMock(null);
    servicoRepository.findOneBy.mockResolvedValue(existingServico);
    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    servicoRepository.merge.mockReturnValue(updatedServico);
    servicoRepository.save.mockResolvedValue(updatedServico);

    await expect(
      service.update(existingServico.id, updateServicoDto),
    ).resolves.toBe(updatedServico);
    expect(servicoRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('uses default pagination when page and take are omitted', async () => {
    const servicos = [servico()];
    servicoRepository.findAndCount.mockResolvedValue([servicos, 1]);

    const result = await service.findAll({});

    expect(result.data).toEqual(servicos);
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.itemsPerPage).toBe(DefaultPageSize.SERVICO);
    expect(servicoRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: DefaultPageSize.SERVICO,
    });
  });

  it('allows reusing servico name from deleted servico on create', async () => {
    const createServicoDto = {
      servico: 'Serviço deletado',
      descricao: 'Novo serviço',
      precoMaoDeObra: 200,
    };

    const newServico = servico({
      id: 2,
      servico: 'Serviço deletado',
    });

    const queryBuilderMock = createQueryBuilderMock(null); // Deleted not found

    servicoRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    servicoRepository.create.mockReturnValue(newServico);
    servicoRepository.save.mockResolvedValue(newServico);

    await expect(service.create(createServicoDto)).resolves.toBe(newServico);
  });

  it('soft removes a servico', async () => {
    const existingServico = servico();

    servicoRepository.findOneBy.mockResolvedValue(existingServico);
    servicoRepository.softRemove.mockResolvedValue(existingServico);

    await expect(service.remove(existingServico.id)).resolves.toBe(
      existingServico,
    );
  });
});
