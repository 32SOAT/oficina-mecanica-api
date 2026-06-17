import { BadRequestException } from '@nestjs/common';
import { EstoqueTypeormEntity } from './estoque.typeorm.entity';
import { Estoque } from '../../../domain/estoque';

describe('EstoqueTypeormEntity', () => {
  const domain = new Estoque({
    id: 1,
    codigo: 'PCA-001',
    pecasInsumos: 'Pastilha',
    quantidadeFisica: 10,
    quantidadeReservada: 2,
    precoUnitario: 89.9,
  });

  it('converts between domain and entity', () => {
    const entity = EstoqueTypeormEntity.fromDomain(domain);
    expect(entity.codigo).toBe('PCA-001');

    const roundTrip = entity.toDomain();
    expect(roundTrip.quantidadeDisponivel).toBe(8);
  });

  it('calculates quantidade disponivel', () => {
    const entity = EstoqueTypeormEntity.fromDomain(domain);
    expect(entity.quantidadeDisponivel).toBe(8);
  });

  it('mutates via domain operations', () => {
    const entity = EstoqueTypeormEntity.fromDomain(domain);
    entity.reservar(3);
    expect(entity.quantidadeReservada).toBe(5);
  });

  it('maps domain errors to bad request', () => {
    const entity = EstoqueTypeormEntity.fromDomain(domain);
    expect(() => entity.reservar(100)).toThrow(BadRequestException);
  });
});
