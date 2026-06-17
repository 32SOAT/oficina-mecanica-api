import { Estoque } from './estoque';
import { EstoqueOperacaoInvalidaError } from './errors/estoque-operacao-invalida.error';

describe('Estoque', () => {
  const createItem = (overrides: Partial<Parameters<typeof Estoque.create>[0]> & {
    id?: number;
    quantidadeReservada?: number;
  } = {}): Estoque => {
    const { id, quantidadeReservada, ...rest } = overrides;
    return new Estoque({
      id: id ?? 1,
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      quantidadeReservada: quantidadeReservada ?? 5,
      precoUnitario: 89.9,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...rest,
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

  describe('create', () => {
    it('creates item with zero reserved quantity', () => {
      const item = Estoque.create({
        codigo: 'PCA-010',
        pecasInsumos: 'Filtro',
        quantidadeFisica: 5,
        precoUnitario: 20,
      });
      expect(item.quantidadeReservada).toBe(0);
    });
  });

  describe('adicionarReposicao', () => {
    it('increases physical quantity', () => {
      const item = createItem({ quantidadeFisica: 10, quantidadeReservada: 0 });
      const updated = item.adicionarReposicao(5);
      expect(updated.quantidadeFisica).toBe(15);
    });
  });

  describe('reservar', () => {
    it('increases reserved quantity', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 5,
      });
      const updated = item.reservar(10);
      expect(updated.quantidadeReservada).toBe(15);
    });

    it('allows reserving all available stock', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 0,
      });
      const updated = item.reservar(50);
      expect(updated.quantidadeReservada).toBe(50);
    });

    it('throws when quantity is zero', () => {
      const item = createItem();
      expect(() => item.reservar(0)).toThrow(EstoqueOperacaoInvalidaError);
    });

    it('throws when quantity is negative', () => {
      const item = createItem();
      expect(() => item.reservar(-1)).toThrow(EstoqueOperacaoInvalidaError);
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
      const updated = item.reservarComprometidoParaOrdemServico(5);
      expect(updated.quantidadeReservada).toBe(13);
      expect(updated.quantidadeDisponivel).toBe(-3);
    });
  });

  describe('darBaixa', () => {
    it('decreases physical and reserved quantity', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      const updated = item.darBaixa(10);
      expect(updated.quantidadeFisica).toBe(40);
      expect(updated.quantidadeReservada).toBe(0);
    });

    it('decreases physical without touching reserved when reserved is lower', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 3,
      });
      const updated = item.darBaixa(5);
      expect(updated.quantidadeFisica).toBe(45);
      expect(updated.quantidadeReservada).toBe(3);
    });

    it('throws when quantity is zero', () => {
      const item = createItem();
      expect(() => item.darBaixa(0)).toThrow(EstoqueOperacaoInvalidaError);
    });

    it('throws when quantity is negative', () => {
      const item = createItem();
      expect(() => item.darBaixa(-1)).toThrow(EstoqueOperacaoInvalidaError);
    });

    it('throws when quantity exceeds physical stock', () => {
      const item = createItem({ quantidadeFisica: 5 });
      expect(() => item.darBaixa(10)).toThrow(
        'Quantidade para baixa excede o estoque físico',
      );
    });
  });

  describe('darBaixaSomenteDisponivel', () => {
    it('reduz só a quantidade física até o disponível e não altera reservado', () => {
      const item = createItem({
        quantidadeFisica: 50,
        quantidadeReservada: 10,
      });
      const updated = item.darBaixaSomenteDisponivel(8);
      expect(updated.quantidadeFisica).toBe(42);
      expect(updated.quantidadeReservada).toBe(10);
      expect(updated.quantidadeDisponivel).toBe(32);
    });

    it('permite baixa igual ao disponível', () => {
      const item = createItem({
        quantidadeFisica: 20,
        quantidadeReservada: 15,
      });
      const updated = item.darBaixaSomenteDisponivel(5);
      expect(updated.quantidadeFisica).toBe(15);
      expect(updated.quantidadeReservada).toBe(15);
    });

    it('rejeita quando a quantidade excede o disponível', () => {
      const item = createItem({
        quantidadeFisica: 20,
        quantidadeReservada: 18,
      });
      expect(() => item.darBaixaSomenteDisponivel(3)).toThrow(
        'Baixa excede o estoque disponível',
      );
    });

    it('throws when quantity is zero', () => {
      const item = createItem();
      expect(() => item.darBaixaSomenteDisponivel(0)).toThrow(
        EstoqueOperacaoInvalidaError,
      );
    });
  });

  describe('assertRemovivel', () => {
    it('allows removal when physical and reserved quantities are zero', () => {
      const item = createItem({
        quantidadeFisica: 0,
        quantidadeReservada: 0,
      });

      expect(() => item.assertRemovivel()).not.toThrow();
    });

    it('rejects removal when physical quantity is greater than zero', () => {
      const item = createItem({
        quantidadeFisica: 5,
        quantidadeReservada: 0,
      });

      expect(() => item.assertRemovivel()).toThrow(
        'Item só pode ser removido com quantidade física e reservada zeradas.',
      );
    });

    it('rejects removal when reserved quantity is greater than zero', () => {
      const item = createItem({
        quantidadeFisica: 0,
        quantidadeReservada: 2,
      });

      expect(() => item.assertRemovivel()).toThrow(
        'Item só pode ser removido com quantidade física e reservada zeradas.',
      );
    });
  });
});
