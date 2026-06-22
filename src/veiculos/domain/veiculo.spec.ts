import { Veiculo } from './veiculo';

describe('Veiculo', () => {
  const base = {
    id: 'veiculo-id',
    placa: 'ABC1D23',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cliente-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  it('creates veiculo from string placa', () => {
    const veiculo = Veiculo.create(base);
    expect(veiculo.placa.toString()).toBe('ABC1D23');
  });

  it('updates veiculo', () => {
    const veiculo = Veiculo.create(base);
    const updated = veiculo.update({ modelo: 'Yaris' });
    expect(updated.modelo).toBe('Yaris');
  });

  it('soft removes veiculo', () => {
    const veiculo = Veiculo.create(base);
    const removed = veiculo.softRemove();
    expect(removed.deletedAt).toBeInstanceOf(Date);
  });

  it('throws when updating without id', () => {
    const veiculo = Veiculo.create({
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      clienteId: 'cliente-id',
    });
    expect(() => veiculo.update({ marca: 'Honda' })).toThrow(
      'Veículo sem ID não pode ser atualizado',
    );
  });
});
