import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClienteEntity } from '../../../../clientes/infra/typeorm/cliente.typeorm.entity';
import { VeiculoEntity } from '../../../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
import { ServicoEntity } from '../../../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { EstoqueEntity } from '../../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { Cnpj } from '../../../../clientes/domain/value-objects/cnpj';
import { Cpf } from '../../../../clientes/domain/value-objects/cpf';
import { Placa } from '../../../../veiculos/domain/value-objects/placa';
import { DEFAULT_PAGE_SIZE } from '../../../application/constants';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../../common/pagination/pagination.util';
import {
  CriarOrdemServicoInput,
  EditarItensOsInput,
  FiltrosOrdemServicoInput,
  HistoricoStatusOutput,
  OrdemServicoOutput,
} from '../../../application/dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_REPOSITORY,
  OrdemServicoRepository,
} from '../../../application/ports/ordem-servico.repository';
import { mergeObservacaoAvisoCompra } from '../../../domain/observacao-compra';
import {
  calcularReservaComprometida,
  quantidadeComprometidaParaEstorno,
  quantidadeParaBaixaEmExecucao,
} from '../../../domain/reserva-peca';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import { EstoqueOperacaoInvalidaError } from '../../../../estoque/domain/errors/estoque-operacao-invalida.error';
import {
  OsCriadaEvent,
  OsCriadaEventName,
  OrcamentoAprovadoEvent,
  OrcamentoAprovadoEventName,
  OrcamentoGeradoEvent,
  OrcamentoGeradoEventName,
  OrcamentoReprovadoEvent,
  OrcamentoReprovadoEventName,
  OsEmExecucaoEvent,
  OsEmExecucaoEventName,
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from '../../events/ordem-servico.events';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from '../entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from '../entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from '../entity/ordem-servico.typeorm.entity';

@Injectable()
export class OrdemServicoTypeormRepository implements OrdemServicoRepository {
  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private toOutput(entity: OrdemServicoTypeormEntity): OrdemServicoOutput {
    return entity as unknown as OrdemServicoOutput;
  }

  private toHistoricoOutput(
    entity: HistoricoStatusOsEntity,
  ): HistoricoStatusOutput {
    return {
      id: entity.id,
      os_id: entity.os_id,
      statusAnterior: entity.statusAnterior,
      statusNovo: entity.statusNovo,
      usuarioId: entity.usuarioId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private aplicarReservaItemPeca(
    est: EstoqueEntity,
    quantidadeSolicitada: number,
  ): {
    disponivelNoDiagnostico: boolean;
    precisaObservacaoCompra: boolean;
  } {
    const dispAntesReserva = est.quantidadeDisponivel;
    try {
      const snap = calcularReservaComprometida(
        dispAntesReserva,
        quantidadeSolicitada,
      );
      est.reservarComprometidoParaOrdemServico(quantidadeSolicitada);
      return snap;
    } catch (error) {
      if (error instanceof EstoqueOperacaoInvalidaError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async criar(
    dto: CriarOrdemServicoInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const totalItens =
      (dto.itensServico?.length ?? 0) + (dto.itensPeca?.length ?? 0);
    if (totalItens === 0) {
      throw new BadRequestException(
        'A OS precisa de ao menos um serviço ou uma peça.',
      );
    }

    const documento = Cpf.normalize(dto.documentoCliente);
    if (!Cpf.isValid(documento) && !Cnpj.isValid(documento)) {
      throw new BadRequestException('CPF/CNPJ inválido.');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const cliente = await qr.manager.findOne(ClienteEntity, {
        where: { documento },
      });
      if (!cliente) {
        throw new NotFoundException('Cliente não encontrado.');
      }

      const placa = Placa.normalize(dto.placa);
      if (!Placa.isValid(placa)) {
        throw new BadRequestException('Placa inválida.');
      }
      const veiculo = await qr.manager.findOne(VeiculoEntity, {
        where: { placa },
      });
      if (!veiculo) {
        throw new NotFoundException('Veículo não encontrado.');
      }
      if (veiculo.cliente_id !== cliente.id) {
        throw new ConflictException('Veículo não pertence a este cliente.');
      }

      const itensServico: ItemOsServicoEntity[] = [];
      for (const i of dto.itensServico ?? []) {
        const srv = await qr.manager.findOne(ServicoEntity, {
          where: { id: i.servicoId },
        });
        if (!srv) {
          throw new NotFoundException(`Serviço ${i.servicoId} não encontrado.`);
        }
        const item = qr.manager.create(ItemOsServicoEntity, {
          servico_id: srv.id,
          servico: srv,
          precoAplicado: Number(srv.precoMaoDeObra),
        });
        itensServico.push(item);
      }

      const itensPeca: ItemOsEstoqueEntity[] = [];
      let pecaPrecisaObservacaoCompra = false;
      for (const i of dto.itensPeca ?? []) {
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: i.estoqueId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!est) {
          throw new NotFoundException(`Peça ${i.estoqueId} não encontrada.`);
        }
        const snap = this.aplicarReservaItemPeca(est, i.quantidade);
        pecaPrecisaObservacaoCompra ||= snap.precisaObservacaoCompra;
        await qr.manager.save(EstoqueEntity, est);
        const item = qr.manager.create(ItemOsEstoqueEntity, {
          estoque_id: est.id,
          peca: est,
          quantidade: i.quantidade,
          precoAplicado: Number(est.precoUnitario),
          disponivelNoDiagnostico: snap.disponivelNoDiagnostico,
        });
        itensPeca.push(item);
      }

      const os = qr.manager.create(OrdemServicoTypeormEntity, {
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        observacao: mergeObservacaoAvisoCompra(
          dto.observacao,
          pecaPrecisaObservacaoCompra,
        ),
        status: StatusOrdemServico.Recebida,
        itensServico,
        itensPeca,
        valorTotal: 0,
      });

      const calc = new OrdemServicoTypeormEntity();
      Object.assign(calc, os);
      os.valorTotal = calc.calcularValorTotal();

      const saved = await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();

      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(
          saved.id,
          null,
          StatusOrdemServico.Recebida,
          usuarioId ?? null,
        ),
      );
      this.eventEmitter.emit(OsCriadaEventName, new OsCriadaEvent(saved.id));

      return this.toOutput(saved);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async transicionar(
    osId: string,
    para: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(para);
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      return this.toOutput(os);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async substituirItensEmDiagnostico(
    osId: string,
    dto: EditarItensOsInput,
    _usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    void _usuarioId;
    const totalItens =
      (dto.itensServico?.length ?? 0) + (dto.itensPeca?.length ?? 0);
    if (totalItens === 0) {
      throw new BadRequestException(
        'A OS precisa de ao menos um serviço ou uma peça.',
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      if (os.status !== StatusOrdemServico.EmDiagnostico) {
        throw new BadRequestException(
          'Só é possível alterar os itens enquanto a OS está em diagnóstico.',
        );
      }

      const oldServicos = [...(os.itensServico ?? [])];
      const oldPecas = [...(os.itensPeca ?? [])];

      for (const item of oldPecas) {
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (est) {
          const qRev = quantidadeComprometidaParaEstorno(item.quantidade);
          est.quantidadeReservada = Math.max(0, est.quantidadeReservada - qRev);
          await qr.manager.save(EstoqueEntity, est);
        }
      }

      if (oldServicos.length) await qr.manager.softRemove(oldServicos);
      if (oldPecas.length) await qr.manager.softRemove(oldPecas);

      const itensServico: ItemOsServicoEntity[] = [];
      for (const i of dto.itensServico ?? []) {
        const srv = await qr.manager.findOne(ServicoEntity, {
          where: { id: i.servicoId },
        });
        if (!srv) {
          throw new NotFoundException(`Serviço ${i.servicoId} não encontrado.`);
        }
        itensServico.push(
          qr.manager.create(ItemOsServicoEntity, {
            os_id: os.id,
            servico_id: srv.id,
            servico: srv,
            precoAplicado: Number(srv.precoMaoDeObra),
          }),
        );
      }

      const itensPeca: ItemOsEstoqueEntity[] = [];
      let pecaPrecisaObservacaoCompra = false;
      for (const i of dto.itensPeca ?? []) {
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: i.estoqueId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!est) {
          throw new NotFoundException(`Peça ${i.estoqueId} não encontrada.`);
        }
        const snap = this.aplicarReservaItemPeca(est, i.quantidade);
        pecaPrecisaObservacaoCompra ||= snap.precisaObservacaoCompra;
        await qr.manager.save(EstoqueEntity, est);
        itensPeca.push(
          qr.manager.create(ItemOsEstoqueEntity, {
            os_id: os.id,
            estoque_id: est.id,
            peca: est,
            quantidade: i.quantidade,
            precoAplicado: Number(est.precoUnitario),
            disponivelNoDiagnostico: snap.disponivelNoDiagnostico,
          }),
        );
      }

      os.itensServico = itensServico;
      os.itensPeca = itensPeca;
      os.observacao = mergeObservacaoAvisoCompra(
        os.observacao,
        pecaPrecisaObservacaoCompra,
      );
      const calc = new OrdemServicoTypeormEntity();
      Object.assign(calc, os);
      os.valorTotal = calc.calcularValorTotal();

      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      return this.findById(osId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async gerarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.AguardandoAprovacao,
      );
      os.valorTotal = os.calcularValorTotal();
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OrcamentoGeradoEventName,
        new OrcamentoGeradoEvent(os.id),
      );
      return this.toOutput(os);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async aprovarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const t1 = os.avancarStatus(StatusOrdemServico.Aprovada);
      for (const item of os.itensPeca ?? []) {
        if (item.disponivelNoDiagnostico) {
          continue;
        }
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!est) {
          continue;
        }
        if (est.quantidadeFisica < est.quantidadeReservada) {
          continue;
        }
        item.disponivelNoDiagnostico = true;
        await qr.manager.save(ItemOsEstoqueEntity, item);
      }
      const proximo = os.todasPecasDisponiveis()
        ? StatusOrdemServico.AguardandoServico
        : StatusOrdemServico.AguardandoPecasInsumos;
      const t2 = os.avancarStatus(proximo);
      if (proximo === StatusOrdemServico.AguardandoServico) {
        os.observacao = mergeObservacaoAvisoCompra(os.observacao, false);
      }
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, t1.anterior, t1.novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, t2.anterior, t2.novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OrcamentoAprovadoEventName,
        new OrcamentoAprovadoEvent(os.id),
      );
      return this.toOutput(os);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async reprovarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(StatusOrdemServico.Reprovada);
      for (const item of os.itensPeca ?? []) {
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (est) {
          const qRev = quantidadeComprometidaParaEstorno(item.quantidade);
          est.quantidadeReservada = Math.max(0, est.quantidadeReservada - qRev);
          await qr.manager.save(EstoqueEntity, est);
        }
      }
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OrcamentoReprovadoEventName,
        new OrcamentoReprovadoEvent(os.id),
      );
      return this.toOutput(os);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async iniciarExecucao(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: { id: osId },
        relations: ['itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.EmExecucao,
      );
      for (const item of os.itensPeca ?? []) {
        const qBaixa = quantidadeParaBaixaEmExecucao(
          item.disponivelNoDiagnostico,
          item.quantidade,
        );
        if (qBaixa <= 0) {
          continue;
        }
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (est) {
          est.darBaixa(qBaixa);
          await qr.manager.save(EstoqueEntity, est);
        }
      }
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OsEmExecucaoEventName,
        new OsEmExecucaoEvent(os.id),
      );
      return this.toOutput(os);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(filtros: FiltrosOrdemServicoInput) {
    const page = Number(filtros.page ?? 1);
    const take = Number(filtros.take ?? DEFAULT_PAGE_SIZE);
    const offset = calculateOffset(take, page);

    const qb = this.osRepository
      .createQueryBuilder('os')
      .leftJoinAndSelect('os.cliente', 'cliente')
      .leftJoinAndSelect('os.veiculo', 'veiculo');

    if (filtros.status) {
      qb.andWhere('os.status = :status', { status: filtros.status });
    }
    if (filtros.clienteId) {
      qb.andWhere('os.cliente_id = :clienteId', {
        clienteId: filtros.clienteId,
      });
    }
    if (filtros.dataInicio) {
      qb.andWhere('os.createdAt >= :dataInicio', {
        dataInicio: filtros.dataInicio,
      });
    }
    if (filtros.dataFim) {
      qb.andWhere('os.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    qb.orderBy('os.createdAt', 'DESC').skip(offset).take(take);

    const [data, count] = await qb.getManyAndCount();
    const meta = createPaginationMeta(take, page, count) ?? {
      itemsPerPage: take,
      totalItems: count,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };
    return { data: data.map((os) => this.toOutput(os)), meta };
  }

  async findById(id: string): Promise<OrdemServicoOutput> {
    const os = await this.osRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'veiculo',
        'itensServico',
        'itensServico.servico',
        'itensPeca',
        'itensPeca.peca',
      ],
    });
    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }
    return this.toOutput(os);
  }

  async findHistorico(id: string): Promise<HistoricoStatusOutput[]> {
    await this.findById(id);
    const historico = await this.dataSource
      .getRepository(HistoricoStatusOsEntity)
      .find({
        where: { os_id: id },
        order: { createdAt: 'ASC' },
      });
    return historico.map((h) => this.toHistoricoOutput(h));
  }

  async tentarLiberarOsAposReposicaoEstoque(
    estoqueIdsAfetados: number[],
    usuarioId?: string | null,
  ): Promise<void> {
    const ids = [...new Set(estoqueIdsAfetados.filter((id) => id > 0))];
    if (ids.length === 0) return;

    const brutos = await this.osRepository
      .createQueryBuilder('os')
      .innerJoin('os.itensPeca', 'ip')
      .where('os.status = :st', {
        st: StatusOrdemServico.AguardandoPecasInsumos,
      })
      .andWhere('ip.disponivel_no_diagnostico = :ind', { ind: false })
      .andWhere('ip.estoque_id IN (:...eids)', { eids: ids })
      .select('DISTINCT(os.id)', 'id')
      .getRawMany<{ id: string }>();

    const uniq = [...new Set(brutos.map((r) => r.id).filter(Boolean))];
    if (!uniq.length) return;

    const ordenadas = await this.osRepository.find({
      where: { id: In(uniq) },
      select: ['id'],
      order: { createdAt: 'ASC' },
    });
    const osIds = ordenadas.map((o) => o.id);
    for (const osId of osIds) {
      await this.tentarAvancarOsDePecasInsumosParaAguardandoServico(
        osId,
        usuarioId,
      );
    }
  }

  private async tentarAvancarOsDePecasInsumosParaAguardandoServico(
    osId: string,
    usuarioId?: string | null,
  ): Promise<void> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoTypeormEntity, {
        where: {
          id: osId,
          status: StatusOrdemServico.AguardandoPecasInsumos,
        },
        relations: ['itensPeca'],
      });
      if (!os) {
        await qr.commitTransaction();
        return;
      }

      for (const item of os.itensPeca ?? []) {
        if (item.disponivelNoDiagnostico) {
          continue;
        }
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!est) {
          continue;
        }
        if (est.quantidadeFisica < est.quantidadeReservada) {
          continue;
        }
        item.disponivelNoDiagnostico = true;
        await qr.manager.save(ItemOsEstoqueEntity, item);
      }

      if (!os.todasPecasDisponiveis()) {
        await qr.manager.save(OrdemServicoTypeormEntity, os);
        await qr.commitTransaction();
        return;
      }

      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.AguardandoServico,
      );
      os.observacao = mergeObservacaoAvisoCompra(os.observacao, false);
      await qr.manager.save(OrdemServicoTypeormEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
