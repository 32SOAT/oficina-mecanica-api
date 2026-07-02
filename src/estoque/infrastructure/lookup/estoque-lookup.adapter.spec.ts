import { EstoqueLookupAdapter } from './estoque-lookup.adapter';

describe('EstoqueLookupAdapter', () => {
  const repository = {
    findOne: jest.fn(),
  };
  let adapter: EstoqueLookupAdapter;

  beforeEach(() => {
    adapter = new EstoqueLookupAdapter(repository as never);
    jest.clearAllMocks();
  });

  it('retorna snapshot do estoque incluindo soft-deleted quando solicitado', async () => {
    repository.findOne.mockResolvedValue({
      id: 20,
      codigo: 'P-20',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 5,
      quantidadeReservada: 1,
      precoUnitario: '50.00',
    });

    await expect(
      adapter.findSnapshotById(20, { includeDeleted: true }),
    ).resolves.toEqual({
      id: 20,
      codigo: 'P-20',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 5,
      quantidadeReservada: 1,
      precoUnitario: 50,
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 20 },
      withDeleted: true,
    });
  });

  it('consulta sem includeDeleted por padrão', async () => {
    repository.findOne.mockResolvedValue({
      id: 21,
      codigo: 'P-21',
      pecasInsumos: 'Pastilha',
      quantidadeFisica: 3,
      quantidadeReservada: 0,
      precoUnitario: 90,
    });

    await adapter.findSnapshotById(21);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 21 },
      withDeleted: false,
    });
  });

  it('retorna null quando estoque não existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(adapter.findSnapshotById(999)).resolves.toBeNull();
  });
});
