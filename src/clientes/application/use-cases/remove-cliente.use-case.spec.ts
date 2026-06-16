import { HttpException } from '@nestjs/common';
import { RemoveClienteUseCase } from './remove-cliente.use-case';
import type { ClienteRepository } from '../cliente-repository.interface';
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
    expect(result).toBe(cliente);
  });

  it('should throw HttpException when cliente does not exist', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toBeInstanceOf(HttpException);

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
    expect(clienteRepository.softRemove).not.toHaveBeenCalled();
  });

  it('should return 404 error with correct message', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toMatchObject({
      message: 'Cliente não encontrado.',
      status: 404,
    });
  });

  it('should not call softRemove when cliente is missing', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('abc')).rejects.toBeInstanceOf(HttpException);

    expect(clienteRepository.findById).toHaveBeenCalledWith('abc');
    expect(clienteRepository.softRemove).not.toHaveBeenCalled();
  });
});
