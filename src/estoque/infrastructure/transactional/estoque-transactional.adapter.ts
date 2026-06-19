import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import {
  calcularReservaComprometida,
  quantidadeComprometidaParaEstorno,
} from '../../../ordens-de-servico/domain/reserva-peca';
import {
  EstoqueReservaSnapshot,
  EstoqueTransactionalPort,
} from '../../application/ports/estoque-transactional.port';
import { applyEstoqueDomainMutation } from '../helpers/estoque-domain-mutation.helper';
import { EstoqueTypeormEntity } from '../typeorm/entity/estoque.typeorm.entity';

@Injectable()
export class EstoqueTransactionalAdapter implements EstoqueTransactionalPort {
  async reservarParaOrdemServico(
    em: EntityManager,
    estoqueId: number,
    quantidade: number,
  ): Promise<EstoqueReservaSnapshot> {
    const est = await em.findOne(EstoqueTypeormEntity, {
      where: { id: estoqueId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!est) {
      throw new NotFoundError(`Peça ${estoqueId} não encontrada.`);
    }
    const snap = calcularReservaComprometida(
      est.quantidadeDisponivel,
      quantidade,
    );
    applyEstoqueDomainMutation(est, (domain) =>
      domain.reservarComprometidoParaOrdemServico(quantidade),
    );
    await em.save(EstoqueTypeormEntity, est);
    return {
      estoqueId: est.id,
      precoAplicado: Number(est.precoUnitario),
      disponivelNoDiagnostico: snap.disponivelNoDiagnostico,
      precisaObservacaoCompra: snap.precisaObservacaoCompra,
    };
  }

  async estornarReservas(
    em: EntityManager,
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<void> {
    for (const item of itens) {
      const est = await em.findOne(EstoqueTypeormEntity, {
        where: { id: item.estoqueId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!est) continue;
      const qRev = quantidadeComprometidaParaEstorno(item.quantidade);
      est.quantidadeReservada = Math.max(0, est.quantidadeReservada - qRev);
      await em.save(EstoqueTypeormEntity, est);
    }
  }

  async estoqueCobreReservaAtual(
    em: EntityManager,
    estoqueId: number,
  ): Promise<boolean> {
    const est = await em.findOne(EstoqueTypeormEntity, {
      where: { id: estoqueId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!est) return false;
    return est.quantidadeFisica >= est.quantidadeReservada;
  }

  async darBaixaEmExecucao(
    em: EntityManager,
    estoqueId: number,
    quantidade: number,
  ): Promise<void> {
    if (quantidade <= 0) return;
    const est = await em.findOne(EstoqueTypeormEntity, {
      where: { id: estoqueId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!est) return;
    applyEstoqueDomainMutation(est, (domain) => domain.darBaixa(quantidade));
    await em.save(EstoqueTypeormEntity, est);
  }
}
