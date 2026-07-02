import { VeiculoLookupAdapter } from './veiculo-lookup.adapter';

describe('VeiculoLookupAdapter', () => {
  const repository = {
    findOne: jest.fn(),
  };
  let adapter: VeiculoLookupAdapter;

  beforeEach(() => {
    adapter = new VeiculoLookupAdapter(repository as never);
    jest.clearAllMocks();
  });

  it('retorna snapshot do veículo incluindo soft-deleted quando solicitado', async () => {
    const deletedAt = new Date('2026-02-01');
    repository.findOne.mockResolvedValue({
      id: 'vei-1',
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: 'cli-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt,
    });

    await expect(
      adapter.findSnapshotById('vei-1', { includeDeleted: true }),
    ).resolves.toEqual({
      id: 'vei-1',
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: 'cli-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt,
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'vei-1' },
      withDeleted: true,
    });
  });

  it('retorna null quando veículo não existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(adapter.findSnapshotById('nope')).resolves.toBeNull();
  });

  it('consulta sem includeDeleted por padrão', async () => {
    repository.findOne.mockResolvedValue({
      id: 'vei-1',
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: 'cli-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
    });

    await adapter.findSnapshotById('vei-1');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'vei-1' },
      withDeleted: false,
    });
  });
});
