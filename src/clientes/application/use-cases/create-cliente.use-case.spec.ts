import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateClienteDto } from '../../presentation/dtos/create-cliente.dto';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';
import { CreateClienteUseCase } from './create-cliente.use-case';
import type { ClienteRepository } from '../cliente-repository.interface';

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

  it('creates a client when documento is valid and unique', async () => {
    const dto: CreateClienteDto = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };
    const savedCliente = Cliente.create({
      id: 'cliente-id',
      documento: ClienteDocumento.create(dto.documento),
      nome: dto.nome,
      email: dto.email,
      celularNumero: dto.celularNumero,
    });

    clienteRepository.existsByDocumento.mockResolvedValue(false);
    clienteRepository.save.mockResolvedValue(savedCliente);

    await expect(useCase.execute(dto)).resolves.toBe(savedCliente);
    expect(clienteRepository.existsByDocumento).toHaveBeenCalledWith(dto.documento);
    expect(clienteRepository.save).toHaveBeenCalled();
  });

  it('throws conflict when documento is already in use', async () => {
    const dto: CreateClienteDto = {
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    clienteRepository.existsByDocumento.mockResolvedValue(true);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws bad request when documento is invalid', async () => {
    const dto: CreateClienteDto = {
      documento: '11111111111',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    };

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });
});
