import { HttpException } from '@nestjs/common';
import { ClienteController } from './cliente.controller';
import { PaginationService } from '../../../querying/pagination.service';
import { Cliente } from '../../domain/cliente';
import { CreateClienteUseCase } from '../../application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from '../../application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from '../../application/use-cases/find-cliente-by-documento.use-case';
import { UpdateClienteUseCase } from '../../application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from '../../application/use-cases/remove-cliente.use-case';

type CreateClienteUseCaseMock = jest.Mocked<
  Pick<CreateClienteUseCase, 'execute'>
>;
type FindAllClientesUseCaseMock = jest.Mocked<
  Pick<FindAllClientesUseCase, 'execute'>
>;
type FindClienteByDocumentoUseCaseMock = jest.Mocked<
  Pick<FindClienteByDocumentoUseCase, 'execute'>
>;
type UpdateClienteUseCaseMock = jest.Mocked<
  Pick<UpdateClienteUseCase, 'execute'>
>;
type RemoveClienteUseCaseMock = jest.Mocked<
  Pick<RemoveClienteUseCase, 'execute'>
>;

describe('ClienteController', () => {
  let controller: ClienteController;
  let createClienteUseCase: CreateClienteUseCaseMock;
  let findAllClientesUseCase: FindAllClientesUseCaseMock;
  let findClienteByDocumentoUseCase: FindClienteByDocumentoUseCaseMock;
  let updateClienteUseCase: UpdateClienteUseCaseMock;
  let removeClienteUseCase: RemoveClienteUseCaseMock;
  let paginationService: PaginationService;
  const cliente = Cliente.create({
    id: 'cliente-id',
    documento: '39053344705',
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
  });

  beforeEach(() => {
    createClienteUseCase = { execute: jest.fn() };
    findAllClientesUseCase = { execute: jest.fn() };
    findClienteByDocumentoUseCase = { execute: jest.fn() };
    updateClienteUseCase = { execute: jest.fn() };
    removeClienteUseCase = { execute: jest.fn() };
    paginationService = new PaginationService();

    controller = new ClienteController(
      createClienteUseCase as unknown as CreateClienteUseCase,
      findAllClientesUseCase as unknown as FindAllClientesUseCase,
      findClienteByDocumentoUseCase as unknown as FindClienteByDocumentoUseCase,
      updateClienteUseCase as unknown as UpdateClienteUseCase,
      removeClienteUseCase as unknown as RemoveClienteUseCase,
      paginationService,
    );
  });

  it('creates a client', async () => {
    const createClienteDto = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    createClienteUseCase.execute.mockResolvedValue(cliente);

    const result = await controller.create(createClienteDto);
    expect(result.id).toBe(cliente.id);
    expect(createClienteUseCase.execute).toHaveBeenCalledWith(createClienteDto);
  });

  it('lets create service exceptions propagate to Nest', async () => {
    const error = new HttpException('Invalid data', 400);
    createClienteUseCase.execute.mockRejectedValue(error);

    await expect(
      controller.create({
        documento: 'invalid',
        nome: 'Jane Doe',
        email: 'jane@example.com',
        celularNumero: '11999999999',
      }),
    ).rejects.toBe(error);
  });

  it('lists clients with pagination', async () => {
    const paginationDto = {
      page: 2,
      take: 5,
    };
    const result = {
      data: [cliente],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    findAllClientesUseCase.execute.mockResolvedValue({
      data: [cliente],
      take: paginationDto.take,
      page: paginationDto.page,
      count: result.meta.totalItems,
    });

    const response = await controller.findAll(paginationDto);
    expect(response.data.length).toBe(1);
    expect(response.meta?.currentPage).toBe(2);
    expect(findAllClientesUseCase.execute).toHaveBeenCalledWith(paginationDto);
  });

  it('lists clients with default pagination when no query is provided', async () => {
    const result = {
      data: [cliente],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    findAllClientesUseCase.execute.mockResolvedValue({
      data: [cliente],
      take: Number(result.meta.itemsPerPage),
      page: 1,
      count: result.meta.totalItems,
    });

    const response = await controller.findAll({});
    expect(response.data.length).toBe(1);
    expect(response.meta?.currentPage).toBe(1);
    expect(findAllClientesUseCase.execute).toHaveBeenCalledWith({});
  });

  it('finds one client by documento', async () => {
    const findClienteByDocumentDto = {
      documento: cliente.documento.toString(),
    };
    findClienteByDocumentoUseCase.execute.mockResolvedValue(cliente);

    const result = await controller.findByDocumento(findClienteByDocumentDto);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(cliente.id);
    expect(findClienteByDocumentoUseCase.execute).toHaveBeenCalledWith(
      findClienteByDocumentDto.documento,
    );
  });

  it('lets findByDocumento service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    findClienteByDocumentoUseCase.execute.mockRejectedValue(error);

    await expect(
      controller.findByDocumento({ documento: '39053344705' }),
    ).rejects.toBe(error);
  });

  it('updates a client', async () => {
    const updateClienteDto = {
      nome: 'Jane Updated',
    };
    const updatedCliente = cliente.update(updateClienteDto);
    updateClienteUseCase.execute.mockResolvedValue(updatedCliente);

    const response = await controller.update(cliente.id!, updateClienteDto);
    expect(response.success).toBe(true);
    expect(updateClienteUseCase.execute).toHaveBeenCalledWith(
      cliente.id,
      updateClienteDto,
    );
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    updateClienteUseCase.execute.mockRejectedValue(error);

    await expect(controller.update('missing-cliente-id', {})).rejects.toBe(
      error,
    );
  });

  it('removes a client', async () => {
    removeClienteUseCase.execute.mockResolvedValue(cliente);

    const response = await controller.remove(cliente.id!);
    expect(response.success).toBe(true);
    expect(removeClienteUseCase.execute).toHaveBeenCalledWith(cliente.id);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    removeClienteUseCase.execute.mockRejectedValue(error);

    await expect(controller.remove('missing-cliente-id')).rejects.toBe(error);
  });
});
