import { HttpException } from '@nestjs/common';
import { FindClienteByIdUseCase } from './find-cliente-by-id.use-case';
import type { ClienteRepository } from '../cliente-repository.interface';
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
    expect(result).toBe(cliente);
  });

  it('should throw HttpException when cliente is not found', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toBeInstanceOf(HttpException);

    expect(clienteRepository.findById).toHaveBeenCalledWith('1');
  });

  it('should throw 404 HttpException with correct message', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toMatchObject({
      message: 'Cliente não encontrado.',
      status: 404,
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
