import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateClienteInput } from '../dto/create-cliente.input';
import { ClienteOutputMapper } from '../dto/cliente.output';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';
import { CreateClienteUseCase } from './create-cliente.use-case';
import type { ClienteRepository } from '../ports/cliente.repository';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'existsByDocumento' | 'save'>
>;

describe('CreateClienteUseCase', () => {
  let useCase: CreateClienteUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      existsByDocumento: jest.fn(),
      save: jest.fn(),
    };
    useCase = new CreateClienteUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a client when documento is valid and unique', async () => {
    const input: CreateClienteInput = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    const savedCliente = Cliente.create({
      id: 'cliente-id',
      documento: ClienteDocumento.create(input.documento),
      nome: input.nome,
      email: input.email,
      celularNumero: input.celularNumero,
    });

    clienteRepository.existsByDocumento.mockResolvedValue(false);
    clienteRepository.save.mockResolvedValue(savedCliente);

    await expect(useCase.execute(input)).resolves.toEqual(
      ClienteOutputMapper.fromDomain(savedCliente),
    );
    expect(clienteRepository.existsByDocumento).toHaveBeenCalledWith(
      input.documento,
    );
    expect(clienteRepository.save).toHaveBeenCalled();
  });

  it('throws conflict when documento is already in use', async () => {
    const input: CreateClienteInput = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    clienteRepository.existsByDocumento.mockResolvedValue(true);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws bad request when documento is invalid', async () => {
    const input: CreateClienteInput = {
      documento: '11111111111',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors from buildDocumento', async () => {
    jest.spyOn(ClienteDocumento, 'create').mockImplementation(() => {
      throw new Error('unexpected');
    });

    await expect(
      useCase.execute({
        documento: '39053344705',
        nome: 'Jane Doe',
        email: 'jane@example.com',
        celularNumero: '11999999999',
      }),
    ).rejects.toThrow('unexpected');
  });
});
