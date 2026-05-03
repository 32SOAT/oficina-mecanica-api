/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClienteEntity } from '../clientes/cliente.entity';
import { VeiculoEntity } from '../veiculos/veiculo.entity';
import { ServicoEntity } from '../servicos/servico.entity';
import { EstoqueEntity } from '../estoque/estoque.entity';
import {
  isValidBrazilianTaxId,
  normalizeTaxId,
} from '../clientes/br-document.validator';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';
import { CriarOrdemServicoDto } from './dtos/criar-ordem-servico.dto';
import { FiltrosOrdemServicoDto } from './dtos/filtros-ordem-servico.dto';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { StatusOrdemServico } from './state-machine/status-ordem-servico.enum';
import {
  OsCriadaEvent,
  OsCriadaEventName,
  OrcamentoAprovadoEvent,
  OrcamentoAprovadoEventName,
  OrcamentoReprovadoEvent,
  OrcamentoReprovadoEventName,
  OsEmExecucaoEvent,
  OsEmExecucaoEventName,
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from './events/ordem-servico.events';

@Injectable()
export class OrdemServicoService {
  constructor(
    @InjectRepository(OrdemServicoEntity)
    private readonly osRepository: Repository<OrdemServicoEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly paginationService: PaginationService,
  ) {}

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

      const veiculo = await qr.manager.findOne(VeiculoEntity, {
        where: { id: dto.veiculoId },
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
      for (const i of dto.itensPeca ?? []) {
        // pessimistic lock: prevents oversell under concurrent OS creation for same item
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: i.estoqueId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!est) {
          throw new NotFoundException(`Peça ${i.estoqueId} não encontrada.`);
        }
        est.reservar(i.quantidade);
        await qr.manager.save(EstoqueEntity, est);
        const item = qr.manager.create(ItemOsEstoqueEntity, {
          estoque_id: est.id,
          peca: est,
          quantidade: i.quantidade,
          precoAplicado: Number(est.precoUnitario),
          disponivelNoDiagnostico: true,
        });
        itensPeca.push(item);
      }

      const os = qr.manager.create(OrdemServicoEntity, {
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        observacao: dto.observacao ?? null,
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
    return this.transicionar(id, novo, usuarioId);
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
          est.quantidadeReservada = Math.max(
            0,
            est.quantidadeReservada - item.quantidade,
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
        const est = await qr.manager.findOne(EstoqueEntity, {
          where: { id: item.estoque_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (est) {
          est.darBaixa(item.quantidade);
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
}
