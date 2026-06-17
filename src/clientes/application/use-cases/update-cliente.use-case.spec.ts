import {
  ConflictException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';

import { UpdateClienteUseCase } from './update-cliente.use-case';
import type { ClienteRepository } from '../ports/cliente.repository';

import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';
import { UpdateClienteInput } from '../dto/update-cliente.input';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'findById' | 'existsByDocumento' | 'save'>
>;

const makeCliente = () =>
  Cliente.create({
    id: 'cliente-id',
    documento: ClienteDocumento.create('52998224725'),
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
  });

describe('UpdateClienteUseCase', () => {
  let useCase: UpdateClienteUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findById: jest.fn(),
      existsByDocumento: jest.fn(),
      save: jest.fn(),
    };

    useCase = new UpdateClienteUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates a client when data is valid and documento is unique', async () => {
    const existingCliente = makeCliente();

    const input: UpdateClienteInput = {
      documento: '04252011000110',
      nome: 'Serviços Vivo',
      email: 'servico-vivo.updated@example.com',
      celularNumero: '11988888888',
    };

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(false);
    clienteRepository.save.mockImplementation(async (cliente) => cliente);

    const result = await useCase.execute(existingCliente.id!, input);

    expect(result.nome).toBe(input.nome);
    expect(result.documento).toBe(input.documento);
    expect(clienteRepository.existsByDocumento).toHaveBeenCalledWith(
      input.documento,
      existingCliente.id!,
    );
    expect(clienteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingCliente.id,
        nome: input.nome,
        email: input.email,
        celularNumero: input.celularNumero,
      }),
    );
  });

  it('updates partial fields without checking documento', async () => {
    const existingCliente = makeCliente();
    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.save.mockImplementation(async (cliente) => cliente);

    const result = await useCase.execute(existingCliente.id!, {
      nome: 'Partial Update',
    });

    expect(result.nome).toBe('Partial Update');
    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
  });

  it('throws http exception when client is not found', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', {})).rejects.toBeInstanceOf(
      HttpException,
    );

    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws conflict when documento is used by another client', async () => {
    const existingCliente = makeCliente();

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(true);

    await expect(
      useCase.execute(existingCliente.id!, {
        documento: '04252011000110', // ✔ válido CNPJ
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws bad request when documento is invalid', async () => {
    const existingCliente = makeCliente();

    clienteRepository.findById.mockResolvedValue(existingCliente);

    await expect(
      useCase.execute(existingCliente.id!, {
        documento: '11111111111',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors from buildDocumento', async () => {
    const existingCliente = makeCliente();
    clienteRepository.findById.mockResolvedValue(existingCliente);
    jest.spyOn(ClienteDocumento, 'create').mockImplementation(() => {
      throw new Error('unexpected');
    });

    await expect(
      useCase.execute(existingCliente.id!, { documento: '39053344705' }),
    ).rejects.toThrow('unexpected');
  });
});
