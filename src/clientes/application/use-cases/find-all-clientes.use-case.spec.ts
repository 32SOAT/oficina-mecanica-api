import { FindAllClientesUseCase } from '../use-cases/find-all-clientes.use-case';
import { DefaultPageSize } from '../../../querying/constants';
import type { ClienteRepository } from '../cliente-repository.interface';
import type { PaginationDto } from '../../../querying/dtos/pagination.dto';

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
    const data = [{ id: '1' }, { id: '2' }];
    const count = 2;

    clienteRepository.findAll.mockResolvedValue([data as any, count]);

    const result = await useCase.execute({});

    expect(clienteRepository.findAll).toHaveBeenCalledWith(
      0,
      DefaultPageSize.CLIENTE,
    );

    expect(result).toEqual({
      data,
      count,
      page: 1,
      take: DefaultPageSize.CLIENTE,
    });
  });

  it('calculates skip correctly based on page and take', async () => {
    const data = [{ id: '3' }];
    const count = 1;

    clienteRepository.findAll.mockResolvedValue([data as any, count]);

    const dto: PaginationDto = {
      page: 3,
      take: 10,
    };

    const result = await useCase.execute(dto);

    expect(clienteRepository.findAll).toHaveBeenCalledWith(20, 10);
    expect(result.page).toBe(3);
    expect(result.take).toBe(10);
    expect(result.data).toBe(data);
  });

  it('uses default take when only page is provided', async () => {
    clienteRepository.findAll.mockResolvedValue([[], 0]);

    await useCase.execute({
      page: 2,
    });

    expect(clienteRepository.findAll).toHaveBeenCalledWith(
      (2 - 1) * DefaultPageSize.CLIENTE,
      DefaultPageSize.CLIENTE,
    );
  });

  it('returns correct shape structure', async () => {
    clienteRepository.findAll.mockResolvedValue([[], 0]);

    const result = await useCase.execute({
      page: 1,
      take: 1,
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('take');
  });
});
