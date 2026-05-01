import { DataSource } from 'typeorm';
import { ClienteEntity } from '../../clientes/cliente.entity';
import { ServicoEntity } from '../../servicos/servico.entity';
import { SeedingService } from './seeding.service';

describe('SeedingService', () => {
  let service: SeedingService;
  let dataSource: jest.Mocked<DataSource>;

  const setup = (options?: {
    existingClientes?: Array<{ id: string }>;
    existingServicos?: Array<{ servico: string }>;
    existingEstoque?: string[];
    existingVeiculos?: Array<{ id: string; cliente_id: string }>;
  }) => {
    const existingClientes = options?.existingClientes ?? [];
    const existingServicos = options?.existingServicos ?? [];
    const existingEstoque = options?.existingEstoque ?? [];
    const existingVeiculos = options?.existingVeiculos ?? [];

    const clienteRepository = {
      find: jest.fn().mockResolvedValue(existingClientes),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (clientes: Array<Record<string, unknown>>) =>
        clientes.map((cliente, index) => ({
          id: `cliente-${existingClientes.length + index + 1}`,
          ...cliente,
        })),
      ),
    };

    const servicoRepository = {
      find: jest.fn().mockResolvedValue(existingServicos),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (servicos: Array<Record<string, unknown>>) =>
        servicos.map((servico, index) => ({
          id: existingServicos.length + index + 1,
          ...servico,
        })),
      ),
    };

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === ClienteEntity) {
          return clienteRepository;
        }
        if (entity === ServicoEntity) {
          return servicoRepository;
        }
        return undefined;
      }),
      createQueryBuilder: jest.fn(() => {
        const context: { table?: string; values?: unknown[] } = {};
        const builder = {
          select: jest.fn(() => builder),
          addSelect: jest.fn(() => builder),
          from: jest.fn((table: string) => {
            context.table = table;
            return builder;
          }),
          insert: jest.fn(() => builder),
          into: jest.fn((table: string) => {
            context.table = table;
            return builder;
          }),
          values: jest.fn((values: unknown[]) => {
            context.values = values;
            return builder;
          }),
          returning: jest.fn(() => builder),
          getRawMany: jest.fn(async () => {
            if (context.table === 'estoque') {
              return existingEstoque.map((pecas_insumos) => ({ pecas_insumos }));
            }
            if (context.table === 'veiculo') {
              return existingVeiculos;
            }
            return [];
          }),
          execute: jest.fn(async () => {
            if (context.table === 'estoque') {
              const values = context.values ?? [];
              return {
                raw: values.map((value, index) => ({
                  id: index + 1,
                  ...(value as object),
                })),
              };
            }

            if (context.table === 'veiculo') {
              const values = context.values ?? [];
              return {
                raw: values.map((value, index) => ({
                  id: `veiculo-${existingVeiculos.length + index + 1}`,
                  ...(value as object),
                })),
              };
            }

            return { raw: [] };
          }),
        };
        return builder;
      }),
    };

    dataSource = {
      transaction: jest.fn(async (runner) => runner(manager as never)),
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

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(result.clientes.count).toBe(5);
    expect(result.clientes.data).toHaveLength(5);
    expect(result.veiculos.count).toBe(5);
    expect(result.servicos.count).toBe(5);
    expect(result.estoque.count).toBe(5);
    expect(result.message).toContain('Seeding concluido');
  });

  it('does not duplicate servicos, estoque, clientes and veiculos when already present', async () => {
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
        'Pastilha de freio dianteira',
        'Disco de freio ventilado',
        'Oleo de motor 5W30',
        'Filtro de oleo',
        'Filtro de ar do motor',
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

    expect(result.clientes.count).toBe(0);
    expect(result.veiculos.count).toBe(0);
    expect(result.servicos.count).toBe(0);
    expect(result.estoque.count).toBe(0);
  });

  it('normalizes strings and generates valid placa format', () => {
    setup();
    const normalized = (service as any).normalize('Óleo de Motor');
    const placa = (service as any).generateUniquePlaca(7);

    expect(normalized).toBe('oleodemotor');
    expect(placa).toMatch(/^[A-Z]{3}[0-9][A-Z][0-9]{3}$/);
  });
});
