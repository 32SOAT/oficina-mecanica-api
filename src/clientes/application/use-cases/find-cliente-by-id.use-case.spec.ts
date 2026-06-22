import {
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { FindClienteByIdUseCase } from './find-cliente-by-id.use-case';
import type { ClienteRepository } from '../ports/cliente.repository';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';

type ClienteRepositoryMock = jest.Mocked<Pick<ClienteRepository, 'findById'>>;

describe('FindClienteByIdUseCase', () => {
  let useCase: FindClienteByIdUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findById: jest.fn(),
    };

    useCase = new FindClienteByIdUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  it('should return cliente when found by id', async () => {
    const cliente = Cliente.create({
      id: '1',
      nome: 'John Doe',
      documento: ClienteDocumento.create('39053344705'),
      email: 'john@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findById.mockResolvedValue(cliente);

    const result = await useCase.execute('1');

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(cliente);
  });

  it('should throw NotFoundError when cliente is not found', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toBeInstanceOf(NotFoundError);

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundError with correct message and statusCode 404', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toMatchObject({
      message: 'Cliente não encontrado.',
      statusCode: 404,
    });
  });

  it('should not modify id before calling repository', async () => {
    const cliente = Cliente.create({
      id: '1',
      nome: 'John Doe',
      documento: ClienteDocumento.create('39053344705'),
      email: 'john@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findById.mockResolvedValue(cliente);

    await useCase.execute('abc-123');

    expect(clienteRepository.findById).toHaveBeenCalledWith('abc-123');
  });
});
