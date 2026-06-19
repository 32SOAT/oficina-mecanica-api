import { FindAllClientesUseCase } from '../use-cases/find-all-clientes.use-case';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { ClienteRepository } from '../ports/cliente.repository';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';

type ClienteRepositoryMock = jest.Mocked<Pick<ClienteRepository, 'findAll'>>;

describe('FindAllClientesUseCase', () => {
  let useCase: FindAllClientesUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findAll: jest.fn(),
    };

    useCase = new FindAllClientesUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  it('returns paginated clients with default pagination', async () => {
    const cliente = Cliente.create({
      id: '1',
      documento: ClienteDocumento.create('39053344705'),
      nome: 'Jane',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });
    const output = cliente;

    clienteRepository.findAll.mockResolvedValue([[cliente], 1]);

    const result = await useCase.execute({});

    expect(clienteRepository.findAll).toHaveBeenCalledWith(
      0,
      DEFAULT_PAGE_SIZE,
    );

    expect(result.data).toEqual([output]);
    expect(result.meta).toEqual({
      itemsPerPage: DEFAULT_PAGE_SIZE,
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('calculates skip correctly based on page and take', async () => {
    const cliente = Cliente.create({
      id: '3',
      documento: ClienteDocumento.create('39053344705'),
      nome: 'Jane',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findAll.mockResolvedValue([[cliente], 30]);

    const result = await useCase.execute({ page: 3, take: 10 });

    expect(clienteRepository.findAll).toHaveBeenCalledWith(20, 10);
    expect(result.data[0]).toEqual(cliente);
    expect(result.meta?.currentPage).toBe(3);
  });

  it('uses default take when only page is provided', async () => {
    clienteRepository.findAll.mockResolvedValue([[], 0]);

    await useCase.execute({
      page: 2,
    });

    expect(clienteRepository.findAll).toHaveBeenCalledWith(
      (2 - 1) * DEFAULT_PAGE_SIZE,
      DEFAULT_PAGE_SIZE,
    );
  });

  it('returns correct shape structure', async () => {
    clienteRepository.findAll.mockResolvedValue([[], 0]);

    const result = await useCase.execute({
      page: 1,
      take: 1,
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
  });
});
