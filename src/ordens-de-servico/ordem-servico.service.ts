/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClienteEntity } from '../clientes/cliente.entity';
import { VeiculoEntity } from '../veiculos/veiculo.entity';
import { ServicoEntity } from '../servicos/servico.entity';
import { EstoqueEntity } from '../estoque/estoque.entity';
import {
  isValidBrazilianTaxId,
  normalizeTaxId,
} from '../clientes/br-document.validator';
import {
  isValidBrazilianPlate,
  normalizePlate,
} from '../veiculos/br-plate.validator';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';
import { CriarOrdemServicoDto } from './dtos/criar-ordem-servico.dto';
import { EditarItensOsDto } from './dtos/editar-itens-os.dto';
import { FiltrosOrdemServicoDto } from './dtos/filtros-ordem-servico.dto';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { StatusOrdemServico } from './state-machine/status-ordem-servico.enum';
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
} from './events/ordem-servico.events';

const AVISO_AGUARDAR_COMPRA_PECA = 'Será necessário aguardar a compra de uma ou mais peças/insumos para atender esta ordem de serviço.';

@Injectable()
export class OrdemServicoService {
  constructor(
    @InjectRepository(OrdemServicoEntity)
    private readonly osRepository: Repository<OrdemServicoEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly paginationService: PaginationService,
  ) {}

  private static escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private mergeObservacaoAvisoCompra(
    atual: string | null | undefined,
    precisaAviso: boolean,
  ): string | null {
    const atualNorm = atual?.trim() ?? '';
    const semAviso = atualNorm
      .replace(
        new RegExp(
          `(\\n|^)${OrdemServicoService.escapeRegExp(AVISO_AGUARDAR_COMPRA_PECA)}(\\n|$)`,
          'g',
        ),
        '\n',
      )
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!precisaAviso) {
      return semAviso.length > 0 ? semAviso : null;
    }
    if (!semAviso) return AVISO_AGUARDAR_COMPRA_PECA;
    if (semAviso.includes(AVISO_AGUARDAR_COMPRA_PECA)) return semAviso;
    return `${semAviso}\n\n${AVISO_AGUARDAR_COMPRA_PECA}`;
  }

  /**
   * Sempre compromete `quantidadeSolicitada` em estoque (`reservarComprometidoParaOrdemServico`).
   * `disponivelNoDiagnostico` indica se o físico cobria todo o pedido no momento da reserva.
   */
  private aplicarReservaItemPeca(
    est: EstoqueEntity,
    quantidadeSolicitada: number,
  ): {
    disponivelNoDiagnostico: boolean;
    precisaObservacaoCompra: boolean;
  } {
    const dispAntesReserva = est.quantidadeDisponivel;
    if (quantidadeSolicitada <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    est.reservarComprometidoParaOrdemServico(quantidadeSolicitada);
    const cobertoNoMomento = dispAntesReserva >= quantidadeSolicitada;
    return {
      disponivelNoDiagnostico: cobertoNoMomento,
      precisaObservacaoCompra: !cobertoNoMomento,
    };
  }

  /** Compromisso em `quantidade_reservada` revertido em reprovação / substituição de itens. */
  private quantidadeComprometidaParaEstorno(item: ItemOsEstoqueEntity): number {
    return item.quantidade;
  }

  /** Só consome físico em execução para linhas marcadas como cobertas no diagnóstico. */
  private quantidadeParaBaixaEmExecucao(item: ItemOsEstoqueEntity): number {
    return item.disponivelNoDiagnostico ? item.quantidade : 0;
  }

  async criar(
    dto: CriarOrdemServicoDto,
    usuarioId?: string | null,
  ): Promise<OrdemServicoEntity> {
    const totalItens =
      (dto.itensServico?.length ?? 0) + (dto.itensPeca?.length ?? 0);
    if (totalItens === 0) {
      throw new BadRequestException(
        'A OS precisa de ao menos um serviço ou uma peça.',
      );
    }

    const documento = normalizeTaxId(dto.documentoCliente);
    if (!isValidBrazilianTaxId(documento)) {
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

      const placa = normalizePlate(dto.placa);
      if (!isValidBrazilianPlate(placa)) {
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
        // pessimistic lock: prevents oversell under concurrent OS creation for same item
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

      const os = qr.manager.create(OrdemServicoEntity, {
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        observacao: this.mergeObservacaoAvisoCompra(
          dto.observacao,
          pecaPrecisaObservacaoCompra,
        ),
        status: StatusOrdemServico.Recebida,
        itensServico,
        itensPeca,
        valorTotal: 0,
      });

      const calc = new OrdemServicoEntity();
      Object.assign(calc, os);
      os.valorTotal = calc.calcularValorTotal();

      const saved = (await qr.manager.save(
        OrdemServicoEntity,
        os,
      ));
      await qr.commitTransaction();

      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(saved.id, null, StatusOrdemServico.Recebida, usuarioId ?? null),
      );
      this.eventEmitter.emit(OsCriadaEventName, new OsCriadaEvent(saved.id));

      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // Helper compartilhado: carrega OS, executa transição, persiste, emite evento.
  private async transicionar(
    osId: string,
    para: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(para);
      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      return os;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  iniciarDiagnostico(id: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    return this.transicionar(id, StatusOrdemServico.EmDiagnostico, usuarioId);
  }

  finalizar(id: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    return this.transicionar(id, StatusOrdemServico.Finalizada, usuarioId);
  }

  entregar(id: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    return this.transicionar(id, StatusOrdemServico.Entregue, usuarioId);
  }

  cancelar(id: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    return this.transicionar(id, StatusOrdemServico.Cancelada, usuarioId);
  }

  avancarStatus(
    id: string,
    novo: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoEntity> {
    if (novo === StatusOrdemServico.Reprovada) {
      return this.reprovarOrcamento(id, usuarioId);
    }
    if (novo === StatusOrdemServico.EmExecucao) {
      return this.iniciarExecucao(id, usuarioId);
    }
    return this.transicionar(id, novo, usuarioId);
  }

  async substituirItensEmDiagnostico(
    osId: string,
    dto: EditarItensOsDto,
    _usuarioId?: string | null,
  ): Promise<OrdemServicoEntity> {
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
      const os = await qr.manager.findOne(OrdemServicoEntity, {
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
          const qRev = this.quantidadeComprometidaParaEstorno(item);
          est.quantidadeReservada = Math.max(
            0,
            est.quantidadeReservada - qRev,
          );
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
      os.observacao = this.mergeObservacaoAvisoCompra(
        os.observacao,
        pecaPrecisaObservacaoCompra,
      );
      const calc = new OrdemServicoEntity();
      Object.assign(calc, os);
      os.valorTotal = calc.calcularValorTotal();

      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      return this.findOne(osId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async gerarOrcamento(osId: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoEntity, {
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
      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OrcamentoGeradoEventName,
        new OrcamentoGeradoEvent(os.id),
      );
      return os;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async aprovarOrcamento(osId: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoEntity, {
        where: { id: osId },
        relations: ['itensServico', 'itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const t1 = os.avancarStatus(StatusOrdemServico.Aprovada);
      const proximo = os.todasPecasDisponiveis()
        ? StatusOrdemServico.AguardandoServico
        : StatusOrdemServico.AguardandoPecasInsumos;
      const t2 = os.avancarStatus(proximo);
      await qr.manager.save(OrdemServicoEntity, os);
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
      return os;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async reprovarOrcamento(osId: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoEntity, {
        where: { id: osId },
        relations: ['itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.Reprovada,
      );
      // Estorno inline com lock pessimista
      for (const item of os.itensPeca ?? []) {
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (est) {
          const qRev = this.quantidadeComprometidaParaEstorno(item);
          est.quantidadeReservada = Math.max(
            0,
            est.quantidadeReservada - qRev,
          );
          await qr.manager.save(EstoqueEntity, est);
        }
      }
      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OrcamentoReprovadoEventName,
        new OrcamentoReprovadoEvent(os.id),
      );
      return os;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async iniciarExecucao(osId: string, usuarioId?: string | null): Promise<OrdemServicoEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const os = await qr.manager.findOne(OrdemServicoEntity, {
        where: { id: osId },
        relations: ['itensPeca'],
      });
      if (!os) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }
      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.EmExecucao,
      );
      // Baixa inline com lock pessimista
      for (const item of os.itensPeca ?? []) {
        const qBaixa = this.quantidadeParaBaixaEmExecucao(item);
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
      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(os.id, anterior, novo, usuarioId ?? null),
      );
      this.eventEmitter.emit(
        OsEmExecucaoEventName,
        new OsEmExecucaoEvent(os.id),
      );
      return os;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(filtros: FiltrosOrdemServicoDto) {
    const page = Number(filtros.page ?? 1);
    const take = Number(filtros.take ?? DefaultPageSize.ORDEM_SERVICO);
    const offset = this.paginationService.calculateOffset(take, page);

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
    const meta = this.paginationService.createMeta(take, page, count) ?? {
      itemsPerPage: take,
      totalItems: count,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };
    return { data, meta };
  }

  async findOne(id: string): Promise<OrdemServicoEntity> {
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
    return os;
  }

  async findHistorico(id: string): Promise<HistoricoStatusOsEntity[]> {
    await this.findOne(id); // garante 404 se OS não existe
    return this.dataSource.getRepository(HistoricoStatusOsEntity).find({
      where: { os_id: id },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Após aumento de `quantidade_fisica` (reposição, PUT com mais físico, item novo),
   * para cada OS em AGUARDANDO_PECAS_INSUMOS com linhas ainda não “cobertas” no diagnóstico:
   * se o físico do SKU passa a honrar o total já comprometido em `quantidade_reservada`
   * (`físico >= reservado`), marca as linhas como disponíveis e, se todas as peças da OS
   * estiverem ok, avança para AGUARDANDO_SERVICO (não incrementa reserva de novo aqui).
   */
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
      const os = await qr.manager.findOne(OrdemServicoEntity, {
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
        /* Reserva da OS já está em quantidade_reservada; basta o físico cobrir o compromisso do SKU. */
        if (est.quantidadeFisica < est.quantidadeReservada) {
          continue;
        }
        item.disponivelNoDiagnostico = true;
        await qr.manager.save(ItemOsEstoqueEntity, item);
      }

      if (!os.todasPecasDisponiveis()) {
        await qr.manager.save(OrdemServicoEntity, os);
        await qr.commitTransaction();
        return;
      }

      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.AguardandoServico,
      );
      os.observacao = this.mergeObservacaoAvisoCompra(os.observacao, false);
      await qr.manager.save(OrdemServicoEntity, os);
      await qr.commitTransaction();
      this.eventEmitter.emit(
        StatusAlteradoEventName,
        new StatusAlteradoEvent(
          os.id,
          anterior,
          novo,
          usuarioId ?? null,
        ),
      );
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
