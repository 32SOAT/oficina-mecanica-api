import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { ClienteController } from './cliente.controller';
import { CreateClienteUseCase } from '../../application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from '../../application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from '../../application/use-cases/find-cliente-by-documento.use-case';
import { UpdateClienteUseCase } from '../../application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from '../../application/use-cases/remove-cliente.use-case';
import { ClientePresentationMapper } from '../mappers/cliente-presentation.mapper';
import { Cliente } from '../../domain/cliente';

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

  const clienteDomain = Cliente.create({
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

    controller = new ClienteController(
      createClienteUseCase as unknown as CreateClienteUseCase,
      findAllClientesUseCase as unknown as FindAllClientesUseCase,
      findClienteByDocumentoUseCase as unknown as FindClienteByDocumentoUseCase,
      updateClienteUseCase as unknown as UpdateClienteUseCase,
      removeClienteUseCase as unknown as RemoveClienteUseCase,
    );
  });

  it('creates a client', async () => {
    const createClienteDto = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    createClienteUseCase.execute.mockResolvedValue(clienteDomain);

    const result = await controller.create(createClienteDto);
    expect(result.id).toBe(clienteDomain.id);
    expect(createClienteUseCase.execute).toHaveBeenCalledWith(
      ClientePresentationMapper.toCreateInput(createClienteDto),
    );
  });

  it('lets create use case BadRequestError propagate', async () => {
    const error = new BadRequestError('Invalid data');
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
    const paginationDto = { page: 2, take: 5 };
    findAllClientesUseCase.execute.mockResolvedValue({
      data: [clienteDomain],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    });

    const response = await controller.findAll(paginationDto);
    expect(response.data.length).toBe(1);
    expect(response.meta?.currentPage).toBe(2);
    expect(findAllClientesUseCase.execute).toHaveBeenCalledWith(
      ClientePresentationMapper.toFindAllInput(paginationDto),
    );
  });

  it('lists clients with default pagination when no query is provided', async () => {
    findAllClientesUseCase.execute.mockResolvedValue({
      data: [clienteDomain],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const response = await controller.findAll({});
    expect(response.data.length).toBe(1);
    expect(response.meta?.currentPage).toBe(1);
    expect(findAllClientesUseCase.execute).toHaveBeenCalledWith(
      ClientePresentationMapper.toFindAllInput({}),
    );
  });

  it('finds one client by documento', async () => {
    const findClienteByDocumentDto = {
      documento: clienteDomain.documento.toString(),
    };
    findClienteByDocumentoUseCase.execute.mockResolvedValue(clienteDomain);

    const result = await controller.findByDocumento(findClienteByDocumentDto);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(clienteDomain.id);
    expect(findClienteByDocumentoUseCase.execute).toHaveBeenCalledWith(
      findClienteByDocumentDto.documento,
    );
  });

  it('lets findByDocumento use case NotFoundError propagate', async () => {
    const error = new NotFoundError('Client Not Found');
    findClienteByDocumentoUseCase.execute.mockRejectedValue(error);

    await expect(
      controller.findByDocumento({ documento: '39053344705' }),
    ).rejects.toBe(error);
  });

  it('updates a client', async () => {
    const updateClienteDto = { nome: 'Jane Updated' };
    updateClienteUseCase.execute.mockResolvedValue(
      Cliente.create({
        id: clienteDomain.id,
        documento: clienteDomain.documento.toString(),
        nome: 'Jane Updated',
        email: clienteDomain.email,
        celularNumero: clienteDomain.celularNumero,
      }),
    );

    const response = await controller.update(clienteDomain.id, updateClienteDto);
    expect(response.success).toBe(true);
    expect(updateClienteUseCase.execute).toHaveBeenCalledWith(
      clienteDomain.id,
      ClientePresentationMapper.toUpdateInput(updateClienteDto),
    );
  });

  it('lets update use case NotFoundError propagate', async () => {
    const error = new NotFoundError('Client Not Found');
    updateClienteUseCase.execute.mockRejectedValue(error);

    await expect(controller.update('missing-cliente-id', {})).rejects.toBe(
      error,
    );
  });

  it('removes a client', async () => {
    removeClienteUseCase.execute.mockResolvedValue(clienteDomain);

    const response = await controller.remove(clienteDomain.id);
    expect(response.success).toBe(true);
    expect(removeClienteUseCase.execute).toHaveBeenCalledWith(clienteDomain.id);
  });

  it('lets remove use case NotFoundError propagate', async () => {
    const error = new NotFoundError('Client Not Found');
    removeClienteUseCase.execute.mockRejectedValue(error);

    await expect(controller.remove('missing-cliente-id')).rejects.toBe(error);
  });
});
