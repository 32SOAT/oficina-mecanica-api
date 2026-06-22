import { DataSource } from 'typeorm';
import { Placa } from '../../veiculos/domain/value-objects/placa';
import { ClienteEntity } from '../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { ServicoEntity } from '../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { EstoqueEntity } from '../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { UserEntity } from '../../users/infrastructure/typeorm/entity/user.typeorm.entity';
import { SeedingService } from './seeding.service';

describe('SeedingService', () => {
  let service: SeedingService;
  let dataSource: jest.Mocked<DataSource>;

  const setup = (options?: {
    existingClientes?: Array<{ id: string }>;
    existingServicos?: Array<{ servico: string }>;
    existingEstoque?: Array<{ pecasInsumos: string }>;
    existingVeiculos?: Array<{ id: string; cliente_id: string }>;
  }) => {
    const existingClientes = options?.existingClientes ?? [];
    const existingServicos = options?.existingServicos ?? [];
    const existingEstoque = options?.existingEstoque ?? [];
    const existingVeiculos = options?.existingVeiculos ?? [];

    const userRepository = {
      create: jest.fn((payload: unknown) => payload),
      save: jest.fn((data: unknown[]) =>
        Promise.resolve(
          data.map((item, i) => ({
            id: `user-${i + 1}`,
            ...(item as object),
          })),
        ),
      ),
    };

    const clienteRepository = {
      find: jest.fn().mockResolvedValue(existingClientes),
      create: jest.fn((payload: unknown) => payload),
      save: jest.fn((data: unknown[]) =>
        Promise.resolve(
          data.map((item, i) => ({
            id: `cliente-${i + 1}`,
            ...(item as object),
          })),
        ),
      ),
    };

    const servicoRepository = {
      find: jest.fn().mockResolvedValue(existingServicos),
      create: jest.fn((payload: unknown) => payload),
      save: jest.fn((data: unknown[]) =>
        Promise.resolve(
          data.map((item, i) => ({
            id: `servico-${i + 1}`,
            ...(item as object),
          })),
        ),
      ),
    };

    const estoqueRepository = {
      find: jest.fn().mockResolvedValue(existingEstoque),
      create: jest.fn((payload: unknown) => payload),
      save: jest.fn((data: unknown[]) =>
        Promise.resolve(
          data.map((item, i) => ({
            id: `estoque-${i + 1}`,
            ...(item as object),
          })),
        ),
      ),
    };

    const veiculoRepository = {
      save: jest.fn((data: unknown[]) =>
        Promise.resolve(
          data.map((item, i) => ({
            id: `veiculo-${i + 1}`,
            ...(item as object),
          })),
        ),
      ),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === ClienteEntity) return clienteRepository;
        if (entity === ServicoEntity) return servicoRepository;
        if (entity === EstoqueEntity) return estoqueRepository;
        if (entity === 'veiculo') return veiculoRepository;
        return undefined;
      }),

      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(() => Promise.resolve(existingVeiculos)),
      })),
    };

    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === UserEntity) return userRepository;
        return undefined;
      }),
      transaction: jest.fn((cb: (m: unknown) => unknown) =>
        Promise.resolve(cb(manager)),
      ),
    } as unknown as jest.Mocked<DataSource>;

    service = new SeedingService(dataSource);
  };

  it('should be defined', () => {
    setup();
    expect(service).toBeDefined();
  });

  it('creates base data when database is empty', async () => {
    setup();

    const result = await service.seed();

    expect(result.users.count).toBe(5);
    expect(result.clientes.count).toBe(5);
    expect(result.veiculos.count).toBe(5);
    expect(result.servicos.count).toBe(5);
    expect(result.estoque.count).toBe(5);
    expect(result.message).toContain('Seeding concluído');
  });

  it('does not duplicate existing data', async () => {
    setup({
      existingClientes: [
        { id: 'c1' },
        { id: 'c2' },
        { id: 'c3' },
        { id: 'c4' },
        { id: 'c5' },
      ],
      existingServicos: [
        { servico: 'Troca de oleo e filtro' },
        { servico: 'Revisao do sistema de freio' },
        { servico: 'Troca de filtro de ar e combustivel' },
        { servico: 'Troca de velas de ignicao' },
        { servico: 'Limpeza de sistema de injecao' },
      ],
      existingEstoque: [
        { pecasInsumos: 'Pastilha de freio dianteira' },
        { pecasInsumos: 'Disco de freio ventilado' },
        { pecasInsumos: 'Oleo de motor 5W30' },
        { pecasInsumos: 'Filtro de oleo' },
        { pecasInsumos: 'Filtro de ar do motor' },
      ],
      existingVeiculos: [
        { id: 'v1', cliente_id: 'c1' },
        { id: 'v2', cliente_id: 'c2' },
        { id: 'v3', cliente_id: 'c3' },
        { id: 'v4', cliente_id: 'c4' },
        { id: 'v5', cliente_id: 'c5' },
      ],
    });

    const result = await service.seed();

    expect(result.users.count).toBe(5);
    expect(result.clientes.count).toBe(0);
    expect(result.servicos.count).toBe(0);
    expect(result.estoque.count).toBe(0);
    expect(result.veiculos.count).toBe(0);
  });

  it('normalize and placa generator works', () => {
    setup();

    const svc = service as unknown as {
      normalize: (v: string) => string;
      generatePlaca: (n: number) => string;
    };
    const normalized = svc.normalize('Óleo de Motor');
    const placa = svc.generatePlaca(7);

    expect(normalized).toBe('oleodemotor');
    expect(placa).toMatch(/^[A-Z]{3}\d[A-Z]\d{2}$/);
    expect(Placa.isValid(placa)).toBe(true);
  });
});
