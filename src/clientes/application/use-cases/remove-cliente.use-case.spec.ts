import { NotFoundError } from '../../../common/application/errors/application.errors';
import { RemoveClienteUseCase } from './remove-cliente.use-case';
import type { ClienteRepository } from '../ports/cliente.repository';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'findById' | 'softRemove'>
>;

describe('RemoveClienteUseCase', () => {
  let useCase: RemoveClienteUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findById: jest.fn(),
      softRemove: jest.fn(),
    };

    useCase = new RemoveClienteUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  it('should soft remove cliente when exists', async () => {
    const cliente = Cliente.create({
      id: '1',
      nome: 'John Doe',
      documento: ClienteDocumento.create('39053344705'),
      email: 'john@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findById.mockResolvedValue(cliente);
    clienteRepository.softRemove.mockResolvedValue(cliente);

    const result = await useCase.execute('1');

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
    expect(clienteRepository.softRemove).toHaveBeenCalledWith(cliente);
    expect(result).toEqual(cliente);
  });

  it('should throw NotFoundError when cliente does not exist', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toBeInstanceOf(NotFoundError);

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
    expect(clienteRepository.softRemove).not.toHaveBeenCalled();
  });

  it('should return NotFoundError with correct message and statusCode 404', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toMatchObject({
      message: 'Cliente não encontrado.',
      statusCode: 404,
    });
  });

  it('should not call softRemove when cliente is missing', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('abc')).rejects.toBeInstanceOf(NotFoundError);

    expect(clienteRepository.findById).toHaveBeenCalledWith('abc');
    expect(clienteRepository.softRemove).not.toHaveBeenCalled();
  });
});
