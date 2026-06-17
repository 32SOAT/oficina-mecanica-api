import { EstoqueOutputMapper } from './estoque-output.mapper';

describe('EstoqueOutputMapper', () => {
  it('maps output to domain', () => {
    const output = {
      id: 1,
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha',
      quantidadeFisica: 10,
      quantidadeReservada: 2,
      quantidadeDisponivel: 8,
      precoUnitario: 89.9,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    };

    const domain = EstoqueOutputMapper.toDomain(output);
    expect(domain.codigo).toBe('PCA-001');
    expect(domain.quantidadeFisica).toBe(10);
  });
});
