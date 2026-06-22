import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  CLIENTE_TRANSACTIONAL_PORT,
  ClienteTransactionalPort,
} from '../../../clientes/application/ports/cliente-transactional.port';
import {
  ESTOQUE_TRANSACTIONAL_PORT,
  EstoqueTransactionalPort,
} from '../../../estoque/application/ports/estoque-transactional.port';
import {
  SERVICO_TRANSACTIONAL_PORT,
  ServicoTransactionalPort,
} from '../../../servicos/application/ports/servico-transactional.port';
import {
  VEICULO_TRANSACTIONAL_PORT,
  VeiculoTransactionalPort,
} from '../../../veiculos/application/ports/veiculo-transactional.port';
import {
  EditarItensOsInput,
  OrdemServicoReadModel,
} from '../../application/dto/ordem-servico.dto';
import {
  OrdemServicoTransactionPort,
  OrdemServicoTransactionalOperations,
  OsPecaItemDraft,
  OsPecaItemState,
  OsServicoItemDraft,
  OsWorkflowHandle,
} from '../../application/ports/ordem-servico-transaction.port';
import {
  avancarStatusOrdemServico,
  calcularValorTotalOrdemServico,
  todasPecasDisponiveis,
} from '../../domain/ordem-servico';
import { mergeObservacaoAvisoCompra } from '../../domain/observacao-compra';
import { quantidadeParaBaixaEmExecucao } from '../../domain/reserva-peca';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoReadModelMapper } from '../mappers/ordem-servico-read-model.mapper';
import { ItemOsEstoqueEntity } from '../typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from '../typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from '../typeorm/entity/ordem-servico.typeorm.entity';

class OsTypeormHandle implements OsWorkflowHandle {
  constructor(readonly entity: OrdemServicoTypeormEntity) {}

  get id(): string {
    return this.entity.id;
  }

  get status(): StatusOrdemServico {
    return this.entity.status;
  }

  get observacao(): string | null {
    return this.entity.observacao;
  }

  set observacao(value: string | null) {
    this.entity.observacao = value;
  }

  get valorTotal(): number {
    return Number(this.entity.valorTotal);
  }

  set valorTotal(value: number) {
    this.entity.valorTotal = value;
  }

  get itensPeca(): OsPecaItemState[] {
    return (this.entity.itensPeca ?? []).map((item) => ({
      id: item.id,
      estoqueId: item.estoque_id,
      quantidade: item.quantidade,
      disponivelNoDiagnostico: item.disponivelNoDiagnostico,
    }));
  }

  avancarStatus(para: StatusOrdemServico) {
    const result = avancarStatusOrdemServico(this.entity.status, para);
    this.entity.status = result.novo;
    return result;
  }

  calcularValorTotal(): number {
    return calcularValorTotalOrdemServico(
      this.entity.itensServico ?? [],
      this.entity.itensPeca ?? [],
    );
  }

  todasPecasDisponiveis(): boolean {
    return todasPecasDisponiveis(this.entity.itensPeca ?? []);
  }
}

@Injectable()
export class OrdemServicoTypeormTransaction
  implements OrdemServicoTransactionPort, OrdemServicoTransactionalOperations
{
  private em: EntityManager | null = null;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CLIENTE_TRANSACTIONAL_PORT)
    private readonly clienteTransactional: ClienteTransactionalPort,
    @Inject(VEICULO_TRANSACTIONAL_PORT)
    private readonly veiculoTransactional: VeiculoTransactionalPort,
    @Inject(SERVICO_TRANSACTIONAL_PORT)
    private readonly servicoTransactional: ServicoTransactionalPort,
    @Inject(ESTOQUE_TRANSACTIONAL_PORT)
    private readonly estoqueTransactional: EstoqueTransactionalPort,
  ) {}

  async runInTransaction<T>(
    work: (operations: OrdemServicoTransactionalOperations) => Promise<T>,
  ): Promise<T> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    this.em = qr.manager;
    try {
      const result = await work(this);
      await qr.commitTransaction();
      return result;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      this.em = null;
      await qr.release();
    }
  }

  private manager(): EntityManager {
    if (!this.em) {
      throw new Error('Transação de ordem de serviço não iniciada.');
    }
    return this.em;
  }

  private toReadModel(entity: OrdemServicoTypeormEntity): OrdemServicoReadModel {
    return OrdemServicoReadModelMapper.toReadModel(entity);
  }

  private wrap(entity: OrdemServicoTypeormEntity): OsTypeormHandle {
    return new OsTypeormHandle(entity);
  }

  async findClienteIdByDocumento(documento: string): Promise<string> {
    return this.clienteTransactional.findIdByDocumento(
      this.manager(),
      documento,
    );
  }

  async findVeiculoIdForCliente(
    placa: string,
    clienteId: string,
  ): Promise<string> {
    return this.veiculoTransactional.findIdForCliente(
      this.manager(),
      placa,
      clienteId,
    );
  }

  async buildItensServico(
    itens: Array<{ servicoId: number }>,
  ): Promise<OsServicoItemDraft[]> {
    const result: OsServicoItemDraft[] = [];
    for (const item of itens) {
      const srv = await this.servicoTransactional.findPreco(
        this.manager(),
        item.servicoId,
      );
      result.push({
        servicoId: srv.servicoId,
        precoAplicado: srv.precoAplicado,
      });
    }
    return result;
  }

  async buildItensPecaWithReserva(
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<{
    itens: OsPecaItemDraft[];
    pecaPrecisaObservacaoCompra: boolean;
  }> {
    const result: OsPecaItemDraft[] = [];
    let pecaPrecisaObservacaoCompra = false;
    for (const item of itens) {
      const snap = await this.estoqueTransactional.reservarParaOrdemServico(
        this.manager(),
        item.estoqueId,
        item.quantidade,
      );
      pecaPrecisaObservacaoCompra ||= snap.precisaObservacaoCompra;
      result.push({
        estoqueId: snap.estoqueId,
        quantidade: item.quantidade,
        precoAplicado: snap.precoAplicado,
        disponivelNoDiagnostico: snap.disponivelNoDiagnostico,
      });
    }
    return { itens: result, pecaPrecisaObservacaoCompra };
  }

  async insertNewOs(params: {
    clienteId: string;
    veiculoId: string;
    observacao: string | null;
    itensServico: OsServicoItemDraft[];
    itensPeca: OsPecaItemDraft[];
  }): Promise<OrdemServicoReadModel> {
    const itensServico = params.itensServico.map((item) =>
      this.manager().create(ItemOsServicoEntity, {
        servico_id: item.servicoId,
        precoAplicado: item.precoAplicado,
      }),
    );
    const itensPeca = params.itensPeca.map((item) =>
      this.manager().create(ItemOsEstoqueEntity, {
        estoque_id: item.estoqueId,
        quantidade: item.quantidade,
        precoAplicado: item.precoAplicado,
        disponivelNoDiagnostico: item.disponivelNoDiagnostico,
      }),
    );
    const os = this.manager().create(OrdemServicoTypeormEntity, {
      cliente_id: params.clienteId,
      veiculo_id: params.veiculoId,
      observacao: params.observacao,
      status: StatusOrdemServico.Recebida,
      itensServico,
      itensPeca,
      valorTotal: 0,
    });
    this.refreshValorTotal(this.wrap(os));
    const saved = await this.manager().save(OrdemServicoTypeormEntity, os);
    return this.toReadModel(saved);
  }

  async loadOs(
    osId: string,
    relations: { itensServico?: boolean; itensPeca?: boolean },
  ): Promise<OsWorkflowHandle> {
    const relationList: string[] = [];
    if (relations.itensServico) relationList.push('itensServico');
    if (relations.itensPeca) relationList.push('itensPeca');
    const os = await this.manager().findOne(OrdemServicoTypeormEntity, {
      where: { id: osId },
      relations: relationList,
    });
    if (!os) {
      throw new NotFoundError('Ordem de serviço não encontrada.');
    }
    return this.wrap(os);
  }

  async saveOs(handle: OsWorkflowHandle): Promise<OrdemServicoReadModel> {
    const saved = await this.manager().save(
      OrdemServicoTypeormEntity,
      (handle as OsTypeormHandle).entity,
    );
    return this.toReadModel(saved);
  }

  async estornarReservasPecas(
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<void> {
    await this.estoqueTransactional.estornarReservas(this.manager(), itens);
  }

  async softRemoveOsItens(osId: string): Promise<void> {
    const os = await this.loadOs(osId, {
      itensServico: true,
      itensPeca: true,
    });
    const entity = (os as OsTypeormHandle).entity;
    if (entity.itensServico?.length) {
      await this.manager().softRemove(entity.itensServico);
    }
    if (entity.itensPeca?.length) {
      await this.manager().softRemove(entity.itensPeca);
    }
  }

  async replaceItensInDiagnostico(
    osId: string,
    input: EditarItensOsInput,
  ): Promise<void> {
    const current = await this.loadOs(osId, {
      itensServico: true,
      itensPeca: true,
    });
    const entity = (current as OsTypeormHandle).entity;
    await this.estornarReservasPecas(
      (entity.itensPeca ?? []).map((item) => ({
        estoqueId: item.estoque_id,
        quantidade: item.quantidade,
      })),
    );
    if (entity.itensServico?.length) {
      await this.manager().softRemove(entity.itensServico);
    }
    if (entity.itensPeca?.length) {
      await this.manager().softRemove(entity.itensPeca);
    }

    const itensServico = await Promise.all(
      (input.itensServico ?? []).map(async (item) => {
        const built = await this.buildItensServico([
          { servicoId: item.servicoId },
        ]);
        const draft = built[0];
        return this.manager().create(ItemOsServicoEntity, {
          os_id: osId,
          servico_id: draft.servicoId,
          precoAplicado: draft.precoAplicado,
        });
      }),
    );
    const { itens: pecaDrafts, pecaPrecisaObservacaoCompra } =
      await this.buildItensPecaWithReserva(input.itensPeca ?? []);
    const itensPeca = pecaDrafts.map((item) =>
      this.manager().create(ItemOsEstoqueEntity, {
        os_id: osId,
        estoque_id: item.estoqueId,
        quantidade: item.quantidade,
        precoAplicado: item.precoAplicado,
        disponivelNoDiagnostico: item.disponivelNoDiagnostico,
      }),
    );

    entity.itensServico = itensServico;
    entity.itensPeca = itensPeca;
    entity.observacao = mergeObservacaoAvisoCompra(
      entity.observacao,
      pecaPrecisaObservacaoCompra,
    );
    this.refreshValorTotal(this.wrap(entity));
    await this.manager().save(OrdemServicoTypeormEntity, entity);
  }

  refreshValorTotal(handle: OsWorkflowHandle): void {
    handle.valorTotal = handle.calcularValorTotal();
  }

  async syncPecaDisponibilidadeAposAprovacao(
    handle: OsWorkflowHandle,
  ): Promise<void> {
    const entity = (handle as OsTypeormHandle).entity;
    for (const item of entity.itensPeca ?? []) {
      if (item.disponivelNoDiagnostico) continue;
      const cobre = await this.estoqueTransactional.estoqueCobreReservaAtual(
        this.manager(),
        item.estoque_id,
      );
      if (!cobre) continue;
      item.disponivelNoDiagnostico = true;
      await this.manager().save(ItemOsEstoqueEntity, item);
    }
  }

  async darBaixaPecasEmExecucao(handle: OsWorkflowHandle): Promise<void> {
    const entity = (handle as OsTypeormHandle).entity;
    for (const item of entity.itensPeca ?? []) {
      const qBaixa = quantidadeParaBaixaEmExecucao(
        item.disponivelNoDiagnostico,
        item.quantidade,
      );
      await this.estoqueTransactional.darBaixaEmExecucao(
        this.manager(),
        item.estoque_id,
        qBaixa,
      );
    }
  }

  async estornarReservasAoReprovar(handle: OsWorkflowHandle): Promise<void> {
    const entity = (handle as OsTypeormHandle).entity;
    await this.estornarReservasPecas(
      (entity.itensPeca ?? []).map((item) => ({
        estoqueId: item.estoque_id,
        quantidade: item.quantidade,
      })),
    );
  }

  async syncPecasPendentesAposReposicao(
    handle: OsWorkflowHandle,
  ): Promise<void> {
    for (const item of handle.itensPeca) {
      await this.markPecaDisponivelWhenStockAllows(handle, item);
    }
  }

  async loadOsAguardandoPecasForUpdate(
    osId: string,
  ): Promise<OsWorkflowHandle | null> {
    const os = await this.manager().findOne(OrdemServicoTypeormEntity, {
      where: {
        id: osId,
        status: StatusOrdemServico.AguardandoPecasInsumos,
      },
      relations: ['itensPeca'],
    });
    return os ? this.wrap(os) : null;
  }

  private async markPecaDisponivelWhenStockAllows(
    handle: OsWorkflowHandle,
    item: OsPecaItemState,
  ): Promise<void> {
    if (item.disponivelNoDiagnostico) return;
    const entity = (handle as OsTypeormHandle).entity;
    const peca = entity.itensPeca?.find((p) => p.id === item.id);
    if (!peca) return;
    const cobre = await this.estoqueTransactional.estoqueCobreReservaAtual(
      this.manager(),
      item.estoqueId,
    );
    if (!cobre) return;
    peca.disponivelNoDiagnostico = true;
    await this.manager().save(ItemOsEstoqueEntity, peca);
  }
}
