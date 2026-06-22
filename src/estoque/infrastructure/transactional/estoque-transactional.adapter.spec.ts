import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { EstoqueTypeormEntity } from '../typeorm/entity/estoque.typeorm.entity';
import { EstoqueTransactionalAdapter } from './estoque-transactional.adapter';

describe('EstoqueTransactionalAdapter', () => {
  let adapter: EstoqueTransactionalAdapter;
  let em: jest.Mocked<
    Pick<EntityManager, 'findOne' | 'save'>
  >;

  const estoque = (id = 1, qFis = 10, qRes = 0, preco = 50): EstoqueTypeormEntity => {
    const e = new EstoqueTypeormEntity();
    e.id = id;
    e.quantidadeFisica = qFis;
    e.quantidadeReservada = qRes;
    e.precoUnitario = preco;
    return e;
  };

  beforeEach(() => {
    adapter = new EstoqueTransactionalAdapter();
    em = {
      findOne: jest.fn(),
      save: jest.fn((_e: unknown, x: unknown) => Promise.resolve(x)),
    };
  });

  it('reserva peca e retorna snapshot', async () => {
    const est = estoque(7, 5, 0, 30);
    em.findOne.mockResolvedValue(est);

    const result = await adapter.reservarParaOrdemServico(
      em as unknown as EntityManager,
      7,
      2,
    );

    expect(result).toMatchObject({
      estoqueId: 7,
      precoAplicado: 30,
      disponivelNoDiagnostico: true,
      precisaObservacaoCompra: false,
    });
    expect(est.quantidadeReservada).toBe(2);
    expect(em.save).toHaveBeenCalled();
  });

  it('marca peca como indisponivel quando estoque insuficiente', async () => {
    const est = estoque(7, 1, 0, 30);
    em.findOne.mockResolvedValue(est);

    const result = await adapter.reservarParaOrdemServico(
      em as unknown as EntityManager,
      7,
      3,
    );

    expect(result.disponivelNoDiagnostico).toBe(false);
    expect(result.precisaObservacaoCompra).toBe(true);
    expect(est.quantidadeReservada).toBe(3);
  });

  it('lanca 404 quando peca nao existe', async () => {
    em.findOne.mockResolvedValue(null);
    await expect(
      adapter.reservarParaOrdemServico(em as unknown as EntityManager, 99, 1),
    ).rejects.toThrow(NotFoundError);
  });

  it('estorna reservas', async () => {
    const est = estoque(7, 10, 5);
    em.findOne.mockResolvedValue(est);

    await adapter.estornarReservas(em as unknown as EntityManager, [
      { estoqueId: 7, quantidade: 2 },
    ]);

    expect(est.quantidadeReservada).toBe(3);
  });

  it('estorna reservas ignora item quando peça não existe', async () => {
    em.findOne.mockResolvedValue(null);

    await adapter.estornarReservas(em as unknown as EntityManager, [
      { estoqueId: 99, quantidade: 1 },
    ]);

    expect(em.save).not.toHaveBeenCalled();
  });

  it('verifica cobertura de reserva', async () => {
    em.findOne.mockResolvedValue(estoque(7, 10, 8));

    const cobre = await adapter.estoqueCobreReservaAtual(
      em as unknown as EntityManager,
      7,
    );

    expect(cobre).toBe(true);
  });

  it('estoqueCobreReservaAtual retorna false quando peça não existe', async () => {
    em.findOne.mockResolvedValue(null);

    const cobre = await adapter.estoqueCobreReservaAtual(
      em as unknown as EntityManager,
      99,
    );

    expect(cobre).toBe(false);
  });

  it('estoqueCobreReservaAtual retorna false quando físico não cobre reserva', async () => {
    em.findOne.mockResolvedValue(estoque(7, 5, 8));

    const cobre = await adapter.estoqueCobreReservaAtual(
      em as unknown as EntityManager,
      7,
    );

    expect(cobre).toBe(false);
  });

  it('dar baixa em execucao', async () => {
    const est = estoque(7, 10, 3);
    em.findOne.mockResolvedValue(est);

    await adapter.darBaixaEmExecucao(
      em as unknown as EntityManager,
      7,
      2,
    );

    expect(est.quantidadeFisica).toBe(8);
    expect(est.quantidadeReservada).toBe(1);
  });

  it('darBaixaEmExecucao ignora quantidade zero ou negativa', async () => {
    await adapter.darBaixaEmExecucao(em as unknown as EntityManager, 7, 0);

    expect(em.findOne).not.toHaveBeenCalled();
  });

  it('darBaixaEmExecucao ignora quando peça não existe', async () => {
    em.findOne.mockResolvedValue(null);

    await adapter.darBaixaEmExecucao(
      em as unknown as EntityManager,
      99,
      2,
    );

    expect(em.save).not.toHaveBeenCalled();
  });
});
