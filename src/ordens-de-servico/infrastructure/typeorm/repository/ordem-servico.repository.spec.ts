import { NotFoundError } from '../../../../common/application/errors/application.errors';
import { Repository, DataSource } from 'typeorm';
import { OrdemServicoTypeormEntity as OrdemServicoEntity } from '../entity/ordem-servico.typeorm.entity';
import { OrdemServicoTypeormRepository } from './ordem-servico.repository';
import { StatusOrdemServico as S } from '../../../domain/status-ordem-servico.enum';
import { STATUS_EXCLUIDOS_LISTAGEM_PADRAO } from '../../../domain/listagem-ordem-servico';

describe('OrdemServicoTypeormRepository', () => {
  let service: OrdemServicoTypeormRepository;
  let osRepo: jest.Mocked<Repository<OrdemServicoEntity>>;
  let dataSource: { getRepository: jest.Mock };

  beforeEach(() => {
    dataSource = { getRepository: jest.fn() };
    osRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrdemServicoEntity>>;

    service = new OrdemServicoTypeormRepository(
      osRepo,
      dataSource as unknown as DataSource,
    );
  });

  describe('findAll', () => {
    it('aplica filtros e retorna { data, meta } paginado', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;

      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({
        page: 1,
        take: 5,
        status: S.EmExecucao,
        clienteId: 'cli-1',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('os.status = :status', {
        status: S.EmExecucao,
      });
      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'os.status NOT IN (:...statusExcluidos)',
        expect.anything(),
      );
      expect(qb.andWhere).toHaveBeenCalledWith('os.cliente_id = :clienteId', {
        clienteId: 'cli-1',
      });
      expect(qb.addSelect).toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith(
        'os_prioridade_listagem',
        'ASC',
      );
      expect(qb.addOrderBy).toHaveBeenCalledWith('os.createdAt', 'ASC');
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(5);
    });

    it('exclui finalizadas, entregues e canceladas quando status não é filtrado', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;

      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ page: 1, take: 10 });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'os.status NOT IN (:...statusExcluidos)',
        { statusExcluidos: [...STATUS_EXCLUIDOS_LISTAGEM_PADRAO] },
      );
    });

    it('aplica os filtros de data quando presentes', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;

      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({
        page: 1,
        take: 10,
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('os.createdAt >= :dataInicio', {
        dataInicio: '2026-04-01',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('os.createdAt <= :dataFim', {
        dataFim: '2026-04-30',
      });
    });

    it('usa defaults quando page/take ausentes', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;

      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({});
      expect(result.meta.itemsPerPage).toBe(10);
      expect(result.meta.currentPage).toBe(1);
    });
  });

  describe('findById', () => {
    it('retorna OS com relations carregados', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, { id: 'os-1' });

      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findById('os-1');
      expect(result.id).toBe('os-1');
      const repoFindOneCalls = (osRepo.findOne as jest.Mock).mock
        .calls as unknown[][];
      expect(repoFindOneCalls.length).toBeGreaterThan(0);
      const firstCall = repoFindOneCalls[0];
      const firstArg = firstCall[0] as {
        where?: { id?: string };
        relations?: string[];
      };
      expect(firstArg.where?.id).toBe('os-1');
      expect(firstArg.relations).toEqual(
        expect.arrayContaining([
          'cliente',
          'veiculo',
          'itensServico',
          'itensServico.servico',
          'itensPeca',
          'itensPeca.peca',
        ]),
      );
    });

    it('lança 404 quando não existe', async () => {
      (osRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findHistorico', () => {
    it('retorna histórico ordenado e exige OS existente', async () => {
      const histEntries = [
        { id: 'h1', createdAt: new Date('2026-04-01') },
        { id: 'h2', createdAt: new Date('2026-04-02') },
      ];
      const histRepo = {
        find: jest.fn().mockResolvedValue(histEntries),
      };
      dataSource.getRepository = jest.fn().mockReturnValue(histRepo);

      const os = new OrdemServicoEntity();
      Object.assign(os, { id: 'os-1' });

      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findHistorico('os-1');
      expect(result).toEqual(
        histEntries.map((h) => ({
          id: h.id,
          os_id: h.os_id,
          statusAnterior: h.statusAnterior,
          statusNovo: h.statusNovo,
          usuarioId: h.usuarioId,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
          deletedAt: h.deletedAt,
        })),
      );
      expect(histRepo.find).toHaveBeenCalledWith({
        where: { os_id: 'os-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('propaga 404 quando OS não existe', async () => {
      (osRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findHistorico('nope')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('findIdsAguardandoPecasPorEstoque', () => {
    it('retorna vazio quando ids inválidos', async () => {
      await expect(
        service.findIdsAguardandoPecasPorEstoque([]),
      ).resolves.toEqual([]);
      await expect(
        service.findIdsAguardandoPecasPorEstoque([0, -1]),
      ).resolves.toEqual([]);
    });

    it('consulta OS aguardando peças e ordena por createdAt', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ id: 'os-2' }, { id: 'os-1' }]),
      };
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([
        { id: 'os-1' },
        { id: 'os-2' },
      ]);

      const result = await service.findIdsAguardandoPecasPorEstoque([7, 7, 8]);

      expect(qb.andWhere).toHaveBeenCalledWith('ip.estoque_id IN (:...eids)', {
        eids: [7, 8],
      });
      expect(osRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.anything() },
          order: { createdAt: 'ASC' },
        }),
      );
      expect(result).toEqual(['os-1', 'os-2']);
    });
  });
});
