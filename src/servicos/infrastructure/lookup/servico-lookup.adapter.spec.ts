import { ServicoLookupAdapter } from './servico-lookup.adapter';

describe('ServicoLookupAdapter', () => {
  const repository = {
    findOne: jest.fn(),
  };
  let adapter: ServicoLookupAdapter;

  beforeEach(() => {
    adapter = new ServicoLookupAdapter(repository as never);
    jest.clearAllMocks();
  });

  it('retorna snapshot do serviço incluindo soft-deleted quando solicitado', async () => {
    repository.findOne.mockResolvedValue({
      id: 10,
      servico: 'Alinhamento',
      descricao: 'Geometria',
      precoMaoDeObra: '120.00',
    });

    await expect(
      adapter.findSnapshotById(10, { includeDeleted: true }),
    ).resolves.toEqual({
      id: 10,
      servico: 'Alinhamento',
      descricao: 'Geometria',
      precoMaoDeObra: 120,
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      withDeleted: true,
    });
  });

  it('consulta sem includeDeleted por padrão', async () => {
    repository.findOne.mockResolvedValue({
      id: 11,
      servico: 'Balanceamento',
      precoMaoDeObra: 80,
    });

    await adapter.findSnapshotById(11);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 11 },
      withDeleted: false,
    });
  });

  it('retorna null quando serviço não existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(adapter.findSnapshotById(999)).resolves.toBeNull();
  });
});
