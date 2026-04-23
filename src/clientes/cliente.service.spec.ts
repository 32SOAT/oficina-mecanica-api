import { fake as fakeCpf } from 'validation-br/dist/cpf';
import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
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
>;

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

  beforeEach(() => {
    clienteRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
    } as ClienteRepositoryMock;

    service = new ClienteService(
      clienteRepository as Repository<ClienteEntity>,
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
    const createdCliente = cliente(createClienteDto);
    clienteRepository.findOne.mockResolvedValue(null);
    clienteRepository.create.mockReturnValue(createdCliente);
    clienteRepository.save.mockResolvedValue(createdCliente);

    await expect(service.create(createClienteDto)).resolves.toBe(
      createdCliente,
    );
    expect(clienteRepository.findOne).toHaveBeenCalledWith({
      where: { documento: validDocumento },
    });
    expect(clienteRepository.create).toHaveBeenCalledWith({
      documento: validDocumento,
      nome: createClienteDto.nome,
      email: createClienteDto.email,
      celularNumero: createClienteDto.celularNumero,
    });
    expect(clienteRepository.save).toHaveBeenCalledWith(createdCliente);
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
    expect(clienteRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects duplicate tax ids on create', async () => {
    const validDocumento = fakeCpf(false);
    const createClienteDto = {
      documento: validDocumento,
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    clienteRepository.findOne.mockResolvedValue(cliente());

    await expect(service.create(createClienteDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(clienteRepository.create).not.toHaveBeenCalled();
  });

  it('uses page 1 when pagination page is omitted', async () => {
    const clientes = [cliente()];
    clienteRepository.findAndCount.mockResolvedValue([clientes, 25]);

    const result = await service.findAll({});

    expect(clienteRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: DefaultPageSize.CLIENTE,
    });
    expect(result.meta).toEqual({
      itemsPerPage: DefaultPageSize.CLIENTE,
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
    expect(clienteRepository.findOne).toHaveBeenCalledWith({
      where: { documento: existingCliente.documento },
    });
  });

  it('throws 400 when documento is invalid on findByDocumento', async () => {
    await expect(service.findByDocumento('11111111111')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(clienteRepository.findOne).not.toHaveBeenCalled();
  });

  it('throws 404 when a client is not found by documento', async () => {
    const validDocumento = fakeCpf(false);
    clienteRepository.findOne.mockResolvedValue(null);

    try {
      await service.findByDocumento(validDocumento);
      throw new Error('Expected findByDocumento to throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
      expect((error as HttpException).message).toBe('Client Not Found');
    }
  });

  it('finds one client by id for internal updates', async () => {
    const existingCliente = cliente();
    clienteRepository.findOneBy.mockResolvedValue(existingCliente);

    await expect(service.findOne(existingCliente.id)).resolves.toBe(
      existingCliente,
    );
    expect(clienteRepository.findOneBy).toHaveBeenCalledWith({
      id: existingCliente.id,
    });
  });

  it('throws 404 when a client is not found by id', async () => {
    clienteRepository.findOneBy.mockResolvedValue(null);

    try {
      await service.findOne('missing-cliente-id');
      throw new Error('Expected findOne to throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
      expect((error as HttpException).message).toBe('Client Not Found');
    }
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
    expect(clienteRepository.findOneBy).toHaveBeenCalledWith({
      id: existingCliente.id,
    });
    expect(clienteRepository.merge).toHaveBeenCalledWith(
      existingCliente,
      updateClienteDto,
    );
    expect(clienteRepository.save).toHaveBeenCalledWith(updatedCliente);
  });

  it('soft removes a client', async () => {
    const existingCliente = cliente();
    clienteRepository.findOneBy.mockResolvedValue(existingCliente);
    clienteRepository.softRemove.mockResolvedValue(existingCliente);

    await expect(service.remove(existingCliente.id)).resolves.toBe(
      existingCliente,
    );
    expect(clienteRepository.findOneBy).toHaveBeenCalledWith({
      id: existingCliente.id,
    });
    expect(clienteRepository.softRemove).toHaveBeenCalledWith(existingCliente);
  });
});
