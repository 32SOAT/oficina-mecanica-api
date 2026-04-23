import { HttpException } from '@nestjs/common';
import { ClienteController } from './cliente.controller';
import { ClienteService } from './cliente.service';

type ClienteServiceMock = jest.Mocked<
  Pick<
    ClienteService,
    'create' | 'findAll' | 'findByDocumento' | 'update' | 'remove'
  >
>;

describe('ClienteController', () => {
  let controller: ClienteController;
  let clienteService: ClienteServiceMock;
  const cliente = {
    id: 'cliente-id',
    documento: '39053344705',
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    clienteService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByDocumento: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as ClienteServiceMock;

    controller = new ClienteController(
      clienteService as unknown as ClienteService,
    );
  });

  it('creates a client', async () => {
    const createClienteDto = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    clienteService.create.mockResolvedValue(cliente);

    await expect(controller.create(createClienteDto)).resolves.toBe(cliente);
    expect(clienteService.create).toHaveBeenCalledWith(createClienteDto);
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
    clienteService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(clienteService.findAll).toHaveBeenCalledWith(paginationDto);
  });

  it('finds one client by documento', async () => {
    const findClienteByDocumentDto = { documento: cliente.documento };
    clienteService.findByDocumento.mockResolvedValue(cliente);

    await expect(
      controller.findByDocumento(findClienteByDocumentDto),
    ).resolves.toEqual({
      success: true,
      data: cliente,
      message: 'Client Fetched Successfully',
    });
    expect(clienteService.findByDocumento).toHaveBeenCalledWith(
      findClienteByDocumentDto.documento,
    );
  });

  it('lets findByDocumento service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    clienteService.findByDocumento.mockRejectedValue(error);

    await expect(
      controller.findByDocumento({ documento: '39053344705' }),
    ).rejects.toBe(error);
  });

  it('updates a client', async () => {
    const updateClienteDto = {
      nome: 'Jane Updated',
    };
    clienteService.update.mockResolvedValue({
      ...cliente,
      ...updateClienteDto,
    });

    await expect(controller.update(cliente.id, updateClienteDto)).resolves.toEqual({
      success: true,
      message: 'Client Updated Successfully',
    });
    expect(clienteService.update).toHaveBeenCalledWith(cliente.id, updateClienteDto);
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    clienteService.update.mockRejectedValue(error);

    await expect(controller.update('missing-cliente-id', {})).rejects.toBe(error);
  });

  it('removes a client', async () => {
    clienteService.remove.mockResolvedValue(cliente);

    await expect(controller.remove(cliente.id)).resolves.toEqual({
      success: true,
      message: 'Client Deleted Successfully',
    });
    expect(clienteService.remove).toHaveBeenCalledWith(cliente.id);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('Client Not Found', 404);
    clienteService.remove.mockRejectedValue(error);

    await expect(controller.remove('missing-cliente-id')).rejects.toBe(error);
  });
});
