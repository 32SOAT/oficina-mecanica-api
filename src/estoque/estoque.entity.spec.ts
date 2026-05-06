import { BadRequestException } from '@nestjs/common';
import { EstoqueEntity } from './estoque.entity';

describe('EstoqueEntity', () => {
  const createItem = (
    overrides: Partial<EstoqueEntity> = {},
  ): EstoqueEntity => {
    return Object.assign(new EstoqueEntity(), {
      id: 1,
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      quantidadeReservada: 5,
      precoUnitario: 89.9,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    });
  };

  describe('quantidadeDisponivel', () => {
    it('returns physical minus reserved', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      expect(item.quantidadeDisponivel).toBe(40);
    });

    it('returns zero when all stock is reserved', () => {
      const item = createItem({
        quantidadeFisica: 10,
        quantidadeReservada: 10,
      });
      expect(item.quantidadeDisponivel).toBe(0);
    });
  });

  describe('reservar', () => {
    it('increases reserved quantity', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 5,
      });
      item.reservar(10);
      expect(item.quantidadeReservada).toBe(15);
    });

    it('allows reserving all available stock', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 0,
      });
      item.reservar(50);
      expect(item.quantidadeReservada).toBe(50);
    });

    it('throws when quantity is zero', () => {
      const item = createItem();
      expect(() => item.reservar(0)).toThrow(BadRequestException);
    });

    it('throws when quantity is negative', () => {
      const item = createItem();
      expect(() => item.reservar(-1)).toThrow(BadRequestException);
    });

    it('throws when stock is insufficient', () => {
      const item = createItem({
        quantidadeFisica: 10,
        quantidadeReservada: 8,
      });
      expect(() => item.reservar(5)).toThrow('Estoque insuficiente');
    });

    it('throws with correct available quantity in message', () => {
      const item = createItem({
        quantidadeFisica: 10,
        quantidadeReservada: 7,
      });
      expect(() => item.reservar(5)).toThrow('Disponível: 3, solicitado: 5');
    });
  });

  describe('reservarComprometidoParaOrdemServico', () => {
    it('compromete mesmo ultrapassando o disponível naquele momento', () => {
      const item = createItem({
        quantidadeFisica: 10,
        quantidadeReservada: 8,
      });
      item.reservarComprometidoParaOrdemServico(5);
      expect(item.quantidadeReservada).toBe(13);
      expect(item.quantidadeDisponivel).toBe(-3);
    });
  });

  describe('darBaixa', () => {
    it('decreases physical and reserved quantity', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      item.darBaixa(10);
      expect(item.quantidadeFisica).toBe(40);
      expect(item.quantidadeReservada).toBe(0);
    });

    it('decreases physical without touching reserved when reserved is lower', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 3,
      });
      item.darBaixa(5);
      expect(item.quantidadeFisica).toBe(45);
      expect(item.quantidadeReservada).toBe(3);
    });

    it('throws when quantity is zero', () => {
      const item = createItem();
      expect(() => item.darBaixa(0)).toThrow(BadRequestException);
    });

    it('throws when quantity is negative', () => {
      const item = createItem();
      expect(() => item.darBaixa(-1)).toThrow(BadRequestException);
    });

    it('throws when quantity exceeds physical stock', () => {
      const item = createItem({ quantidadeFisica: 5 });
      expect(() => item.darBaixa(10)).toThrow(
        'Quantidade para baixa excede o estoque físico',
      );
    });
  });
});
