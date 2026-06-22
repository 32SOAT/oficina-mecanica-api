import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';

import { FindClienteByDocumentoUseCase } from './find-cliente-by-documento.use-case';
import type { ClienteRepository } from '../ports/cliente.repository';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'findByDocumento'>
>;

describe('FindClienteByDocumentoUseCase', () => {
  let useCase: FindClienteByDocumentoUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findByDocumento: jest.fn(),
    };

    useCase = new FindClienteByDocumentoUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return cliente when documento exists', async () => {
    const documento = '39053344705';

    const cliente = Cliente.create({
      id: '1',
      nome: 'John Doe',
      documento: ClienteDocumento.create(documento),
      email: 'john@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findByDocumento.mockResolvedValue(cliente);

    const result = await useCase.execute(documento);

    expect(clienteRepository.findByDocumento).toHaveBeenCalledWith(documento);

    expect(result).toEqual(cliente);
  });

  it('should throw NotFoundError when cliente is not found', async () => {
    clienteRepository.findByDocumento.mockResolvedValue(null);

    await expect(useCase.execute('39053344705')).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(clienteRepository.findByDocumento).toHaveBeenCalled();
  });

  it('should throw BadRequestError when documento is invalid', async () => {
    const invalidDocumento = '11111111111';

    await expect(useCase.execute(invalidDocumento)).rejects.toBeInstanceOf(
      BadRequestError,
    );

    expect(clienteRepository.findByDocumento).not.toHaveBeenCalled();
  });

  it('should not call repository when documento creation fails', async () => {
    const malformed = 'abc';

    await expect(useCase.execute(malformed)).rejects.toBeInstanceOf(
      BadRequestError,
    );

    expect(clienteRepository.findByDocumento).not.toHaveBeenCalled();
  });

  it('should pass normalized documento to repository', async () => {
    const raw = '390.533.447-05';
    const normalized = '39053344705';

    const cliente = Cliente.create({
      id: '1',
      nome: 'Jane Doe',
      documento: ClienteDocumento.create(normalized),
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findByDocumento.mockResolvedValue(cliente);

    await useCase.execute(raw);

    expect(clienteRepository.findByDocumento).toHaveBeenCalledWith(normalized);
  });

  it('rethrows unexpected errors from buildDocumento', async () => {
    jest.spyOn(ClienteDocumento, 'create').mockImplementation(() => {
      throw new Error('unexpected');
    });

    await expect(useCase.execute('39053344705')).rejects.toThrow('unexpected');
    expect(clienteRepository.findByDocumento).not.toHaveBeenCalled();
  });
});
