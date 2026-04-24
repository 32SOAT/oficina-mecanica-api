import { fake as fakeCpf } from 'validation-br/dist/cpf';
import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { ClienteEntity } from './cliente.entity';
import { ClienteService } from './cliente.service';
import { UpdateClienteDto } from './dtos/update-cliente.dto';

type ClienteRepositoryMock = jest.Mocked<
  Pick<
    Repository<ClienteEntity>,
    | 'create'
    | 'save'
    | 'findAndCount'
    | 'findOne'
    | 'findOneBy'
    | 'merge'
    | 'softRemove'
  >
> & {
  createQueryBuilder: jest.MockedFunction<
    () => SelectQueryBuilder<ClienteEntity>
  >;
};

describe('ClienteService', () => {
  let service: ClienteService;
  let clienteRepository: ClienteRepositoryMock;

  const cliente = (overrides: Partial<ClienteEntity> = {}): ClienteEntity => ({
    id: 'cliente-id',
    documento: fakeCpf(false),
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const createQueryBuilderMock = (
    getOneValue?: unknown,
  ): SelectQueryBuilder<ClienteEntity> => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ClienteEntity>['where']
      >,
      andWhere: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ClienteEntity>['andWhere']
      >,
      getOne: jest.fn().mockResolvedValue(getOneValue),
    } as unknown as SelectQueryBuilder<ClienteEntity>;

    return queryBuilder;
  };

  beforeEach(() => {
    const queryBuilderMock = {
      where: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ClienteEntity>['where']
      >,
      andWhere: jest.fn().mockReturnThis() as jest.MockedFunction<
        SelectQueryBuilder<ClienteEntity>['andWhere']
      >,
      getOne: jest.fn(),
    } as unknown as SelectQueryBuilder<ClienteEntity>;

    clienteRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    service = new ClienteService(
      clienteRepository as unknown as Repository<ClienteEntity>,
      new PaginationService(),
    );
  });

  it('creates a client with a valid tax id', async () => {
    const validDocumento = fakeCpf(false);

    const createClienteDto = {
      documento: validDocumento,
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    const createdCliente = cliente();

    const queryBuilderMock = createQueryBuilderMock(null);

    clienteRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    clienteRepository.create.mockReturnValue(createdCliente);
    clienteRepository.save.mockResolvedValue(createdCliente);

    await expect(service.create(createClienteDto)).resolves.toBe(
      createdCliente,
    );
  });

  it('rejects invalid tax ids on create', async () => {
    const createClienteDto = {
      documento: '11111111111',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    await expect(service.create(createClienteDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate tax ids on create', async () => {
    const validDocumento = fakeCpf(false);

    const createClienteDto = {
      documento: validDocumento,
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    const queryBuilderMock = createQueryBuilderMock(cliente());

    clienteRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(service.create(createClienteDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('uses page 1 when pagination page is omitted', async () => {
    const clientes = [cliente()];
    clienteRepository.findAndCount.mockResolvedValue([clientes, 25]);

    const result = await service.findAll({});

    expect(clienteRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: Number(DefaultPageSize.CLIENTE),
    });

    expect(result.meta).toEqual({
      itemsPerPage: Number(DefaultPageSize.CLIENTE),
      totalItems: 25,
      currentPage: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('finds one client by documento', async () => {
    const existingCliente = cliente();
    clienteRepository.findOne.mockResolvedValue(existingCliente);

    await expect(
      service.findByDocumento(existingCliente.documento),
    ).resolves.toBe(existingCliente);
  });

  it('throws 400 when documento is invalid on findByDocumento', async () => {
    await expect(service.findByDocumento('11111111111')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws 404 when a client is not found by documento', async () => {
    const validDocumento = fakeCpf(false);
    clienteRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findByDocumento(validDocumento),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('finds one client by id for internal updates', async () => {
    const existingCliente = cliente();
    clienteRepository.findOneBy.mockResolvedValue(existingCliente);

    await expect(service.findOne(existingCliente.id)).resolves.toBe(
      existingCliente,
    );
  });

  it('throws 404 when a client is not found by id', async () => {
    clienteRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('updates a client', async () => {
    const existingCliente = cliente();

    const updateClienteDto: UpdateClienteDto = {
      nome: 'Jane Updated',
    };

    const updatedCliente = cliente(updateClienteDto);

    clienteRepository.findOneBy.mockResolvedValue(existingCliente);
    clienteRepository.merge.mockReturnValue(updatedCliente);
    clienteRepository.save.mockResolvedValue(updatedCliente);

    await expect(
      service.update(existingCliente.id, updateClienteDto),
    ).resolves.toBe(updatedCliente);
  });

  it('updates client documento when valid and unique', async () => {
    const existingCliente = cliente();
    const newDocumento = fakeCpf(false);

    const updateClienteDto: UpdateClienteDto = {
      documento: newDocumento,
    };

    const updatedCliente = { ...existingCliente, documento: newDocumento };

    const queryBuilderMock = createQueryBuilderMock(null);

    clienteRepository.findOneBy.mockResolvedValue(existingCliente);
    clienteRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    clienteRepository.merge.mockReturnValue(updatedCliente);
    clienteRepository.save.mockResolvedValue(updatedCliente);

    await expect(
      service.update(existingCliente.id, updateClienteDto),
    ).resolves.toBe(updatedCliente);
  });

  it('rejects update when new documento is already in use by another client', async () => {
    const existingCliente = cliente();
    const newDocumento = fakeCpf(false);
    const anotherCliente = cliente({
      id: 'another-id',
      documento: newDocumento,
    });

    const updateClienteDto: UpdateClienteDto = {
      documento: newDocumento,
    };

    const queryBuilderMock = createQueryBuilderMock(anotherCliente);

    clienteRepository.findOneBy.mockResolvedValue(existingCliente);
    clienteRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(
      service.update(existingCliente.id, updateClienteDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects update when new documento is invalid', async () => {
    const existingCliente = cliente();

    const updateClienteDto: UpdateClienteDto = {
      documento: '11111111111',
    };

    clienteRepository.findOneBy.mockResolvedValue(existingCliente);

    await expect(
      service.update(existingCliente.id, updateClienteDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows reusing documento from deleted client on create', async () => {
    const deletedClienteDocumento = fakeCpf(false);

    const createClienteDto = {
      documento: deletedClienteDocumento,
      nome: 'New Client',
      email: 'new@example.com',
      celularNumero: '11999999999',
    };

    const newCliente = cliente({
      documento: deletedClienteDocumento,
    });

    const queryBuilderMock = createQueryBuilderMock(null); // Deleted client not found

    clienteRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);
    clienteRepository.create.mockReturnValue(newCliente);
    clienteRepository.save.mockResolvedValue(newCliente);

    await expect(service.create(createClienteDto)).resolves.toBe(newCliente);
  });

  it('soft removes a client', async () => {
    const existingCliente = cliente();

    clienteRepository.findOneBy.mockResolvedValue(existingCliente);
    clienteRepository.softRemove.mockResolvedValue(existingCliente);

    await expect(service.remove(existingCliente.id)).resolves.toBe(
      existingCliente,
    );
  });
});
