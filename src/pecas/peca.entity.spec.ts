import { BadRequestException } from '@nestjs/common';
import { PecaEntity } from './peca.entity';

describe('PecaEntity', () => {
  const createPeca = (overrides: Partial<PecaEntity> = {}): PecaEntity => {
    return Object.assign(new PecaEntity(), {
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
      const peca = createPeca({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      expect(peca.quantidadeDisponivel).toBe(40);
    });

    it('returns zero when all stock is reserved', () => {
      const peca = createPeca({
        quantidadeFisica: 10,
        quantidadeReservada: 10,
      });
      expect(peca.quantidadeDisponivel).toBe(0);
    });
  });

  describe('reservar', () => {
    it('increases reserved quantity', () => {
      const peca = createPeca({ quantidadeFisica: 50, quantidadeReservada: 5 });
      peca.reservar(10);
      expect(peca.quantidadeReservada).toBe(15);
    });

    it('allows reserving all available stock', () => {
      const peca = createPeca({ quantidadeFisica: 50, quantidadeReservada: 0 });
      peca.reservar(50);
      expect(peca.quantidadeReservada).toBe(50);
    });

    it('throws when quantity is zero', () => {
      const peca = createPeca();
      expect(() => peca.reservar(0)).toThrow(BadRequestException);
    });

    it('throws when quantity is negative', () => {
      const peca = createPeca();
      expect(() => peca.reservar(-1)).toThrow(BadRequestException);
    });

    it('throws when stock is insufficient', () => {
      const peca = createPeca({ quantidadeFisica: 10, quantidadeReservada: 8 });
      expect(() => peca.reservar(5)).toThrow('Estoque insuficiente');
    });

    it('throws with correct available quantity in message', () => {
      const peca = createPeca({ quantidadeFisica: 10, quantidadeReservada: 7 });
      expect(() => peca.reservar(5)).toThrow('Disponível: 3, solicitado: 5');
    });
  });

  describe('darBaixa', () => {
    it('decreases physical and reserved quantity', () => {
      const peca = createPeca({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      peca.darBaixa(10);
      expect(peca.quantidadeFisica).toBe(40);
      expect(peca.quantidadeReservada).toBe(0);
    });

    it('decreases physical without touching reserved when reserved is lower', () => {
      const peca = createPeca({ quantidadeFisica: 50, quantidadeReservada: 3 });
      peca.darBaixa(5);
      expect(peca.quantidadeFisica).toBe(45);
      expect(peca.quantidadeReservada).toBe(3);
    });

    it('throws when quantity is zero', () => {
      const peca = createPeca();
      expect(() => peca.darBaixa(0)).toThrow(BadRequestException);
    });

    it('throws when quantity is negative', () => {
      const peca = createPeca();
      expect(() => peca.darBaixa(-1)).toThrow(BadRequestException);
    });

    it('throws when quantity exceeds physical stock', () => {
      const peca = createPeca({ quantidadeFisica: 5 });
      expect(() => peca.darBaixa(10)).toThrow(
        'Quantidade para baixa excede o estoque físico',
      );
    });
  });
});
