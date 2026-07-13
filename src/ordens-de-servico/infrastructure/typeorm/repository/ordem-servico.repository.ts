import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../common/application/errors/application.errors';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../../../../clientes/application/ports/cliente-lookup.port';
import {
  ESTOQUE_LOOKUP_PORT,
  EstoqueLookupPort,
} from '../../../../estoque/application/ports/estoque-lookup.port';
import {
  SERVICO_LOOKUP_PORT,
  ServicoLookupPort,
} from '../../../../servicos/application/ports/servico-lookup.port';
import {
  VEICULO_LOOKUP_PORT,
  VeiculoLookupPort,
} from '../../../../veiculos/application/ports/veiculo-lookup.port';
import { DataSource, In, Repository } from 'typeorm';
import { DEFAULT_PAGE_SIZE } from '../../../application/constants';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../../common/pagination/pagination.util';
import {
  FiltrosOrdemServicoInput,
  HistoricoStatusReadModel,
  OrdemServicoReadModel,
} from '../../../application/dto/ordem-servico.dto';
import { OrdemServicoQueryPort } from '../../../application/ports/ordem-servico-query.port';
import { STATUS_EXCLUIDOS_LISTAGEM_PADRAO } from '../../../domain/listagem-ordem-servico';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import {
  buildOrdemServicoReadModel,
  OrdemServicoReadModelLookupPorts,
} from '../../helpers/ordem-servico-read-model.loader';
import { buildPrioridadeStatusListagemCaseSql } from '../helpers/ordem-servico-listagem-order.helper';
import { OrdemServicoReadModelMapper } from '../../mappers/ordem-servico-read-model.mapper';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { OrdemServicoTypeormEntity } from '../entity/ordem-servico.typeorm.entity';

@Injectable()
export class OrdemServicoTypeormRepository implements OrdemServicoQueryPort {
  private readonly readModelLookups: OrdemServicoReadModelLookupPorts;

  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CLIENTE_LOOKUP_PORT)
    clienteLookup: ClienteLookupPort,
    @Inject(VEICULO_LOOKUP_PORT)
    veiculoLookup: VeiculoLookupPort,
    @Inject(SERVICO_LOOKUP_PORT)
    servicoLookup: ServicoLookupPort,
    @Inject(ESTOQUE_LOOKUP_PORT)
    estoqueLookup: EstoqueLookupPort,
  ) {
    this.readModelLookups = {
      clienteLookup,
      veiculoLookup,
      servicoLookup,
      estoqueLookup,
    };
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
    } else {
      qb.andWhere('os.status NOT IN (:...statusExcluidos)', {
        statusExcluidos: [...STATUS_EXCLUIDOS_LISTAGEM_PADRAO],
      });
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

    const prioridadeListagem = buildPrioridadeStatusListagemCaseSql('os.status');
    qb.addSelect(prioridadeListagem, 'os_prioridade_listagem')
      .orderBy('os_prioridade_listagem', 'ASC')
      .addOrderBy('os.createdAt', 'ASC')
      .skip(offset)
      .take(take);

    const [data, count] = await qb.getManyAndCount();
    const meta = createPaginationMeta(take, page, count) ?? {
      itemsPerPage: take,
      totalItems: count,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };
    return {
      data: await Promise.all(
        data.map((os) => buildOrdemServicoReadModel(os, this.readModelLookups)),
      ),
      meta,
    };
  }

  async findById(id: string): Promise<OrdemServicoReadModel> {
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
      throw new NotFoundError('Ordem de serviço não encontrada.');
    }

    return buildOrdemServicoReadModel(os, this.readModelLookups);
  }

  async findHistorico(id: string): Promise<HistoricoStatusReadModel[]> {
    await this.findById(id);
    const historico = await this.dataSource
      .getRepository(HistoricoStatusOsEntity)
      .find({
        where: { os_id: id },
        order: { createdAt: 'ASC' },
      });
    return historico.map((h) =>
      OrdemServicoReadModelMapper.toHistoricoReadModel(h),
    );
  }

  async findIdsAguardandoPecasPorEstoque(
    estoqueIds: number[],
  ): Promise<string[]> {
    const ids = [...new Set(estoqueIds.filter((id) => id > 0))];
    if (!ids.length) return [];

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

    const uniq = [...new Set(brutos.map((row) => row.id).filter(Boolean))];
    if (!uniq.length) return [];

    const ordenadas = await this.osRepository.find({
      where: { id: In(uniq) },
      select: ['id'],
      order: { createdAt: 'ASC' },
    });
    return ordenadas.map((os) => os.id);
  }
}
