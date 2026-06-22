import { Veiculo } from '../../domain/veiculo';
import { VeiculoResponseDto } from './veiculo-response.dto';

describe('VeiculoResponseDto', () => {
  const base = {
    id: 'vei-1',
    placa: 'ABC1D23',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cli-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  };

  it('fromDomain mapeia veículo sem cliente embutido', () => {
    const dto = VeiculoResponseDto.fromDomain(Veiculo.create(base));

    expect(dto.id).toBe('vei-1');
    expect(dto.placa).toBe('ABC1D23');
    expect(dto.cliente).toBeUndefined();
  });

  it('fromDomain mapeia resumo do cliente quando presente', () => {
    const dto = VeiculoResponseDto.fromDomain(
      Veiculo.create({
        ...base,
        cliente: {
          id: 'cli-1',
          documento: '39053344705',
          nome: 'Jane',
          email: 'jane@example.com',
          celularNumero: '11999999999',
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
          deletedAt: null,
        },
      }),
    );

    expect(dto.cliente?.nome).toBe('Jane');
    expect(dto.cliente?.documento).toBe('39053344705');
  });
});
