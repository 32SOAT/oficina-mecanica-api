import { fake as fakeCpf } from 'validation-br/dist/cpf';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClienteEntity } from '../clientes/cliente.entity';
import { VeiculoEntity } from '../veiculos/veiculo.entity';
import { ServicoEntity } from '../servicos/servico.entity';
import { EstoqueEntity } from '../estoque/estoque.entity';
import { OrdemServicoEntity } from './ordem-servico.entity';
import { OrdemServicoService } from './ordem-servico.service';
import { StatusOrdemServico as S } from './state-machine/status-ordem-servico.enum';
import { PaginationService } from '../querying/pagination.service';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';

type MockEntityManager = jest.Mocked<
  Pick<
    typeof import('typeorm').EntityManager,
    'findOne' | 'findOneBy' | 'find' | 'save' | 'create'
  >
>;

type MockDataSource = {
  createQueryRunner: jest.Mock;
  queryRunner: jest.Mocked<
    Pick<
      typeof import('typeorm').QueryRunner,
      | 'connect'
      | 'startTransaction'
      | 'commitTransaction'
      | 'rollbackTransaction'
      | 'release'
    >
  > & { manager: MockEntityManager };
};

describe('OrdemServicoService', () => {
  let service: OrdemServicoService;
  let osRepo: jest.Mocked<Repository<OrdemServicoEntity>>;
  let dataSource: MockDataSource;
  let em: MockEntityManager;
  let emitter: jest.Mocked<EventEmitter2>;
  let paginationService: PaginationService;

  const cliente = (overrides: Partial<ClienteEntity> = {}): ClienteEntity => ({
    id: 'cli-1',
    documento: fakeCpf(false),
    nome: 'João',
    email: 'a@b.c',
    celularNumero: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const veiculo = (overrides: Partial<VeiculoEntity> = {}): VeiculoEntity => ({
    id: 'vei-1',
    placa: 'ABC1D23',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    cliente_id: 'cli-1',
    cliente: cliente(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const servico = (id = 1, preco = 100): ServicoEntity => ({
    id,
    servico: 'Troca óleo',
    precoMaoDeObra: preco,
    descricao: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const estoque = (id = 1, qFis = 10, qRes = 0, preco = 50): EstoqueEntity => {
    const e = new EstoqueEntity();
    Object.assign(e, {
      id,
      codigo: `PCA-${id}`,
      pecasInsumos: 'Filtro',
      quantidadeFisica: qFis,
      quantidadeReservada: qRes,
      precoUnitario: preco,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    return e;
  };

  beforeEach(() => {
    em = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      save: jest.fn((_e: unknown, x: unknown) => Promise.resolve(x)),
      create: jest.fn((_E: unknown, data: unknown) => data),
    };
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: em,
    } as jest.Mocked<
      Pick<
        typeof import('typeorm').QueryRunner,
        | 'connect'
        | 'startTransaction'
        | 'commitTransaction'
        | 'rollbackTransaction'
        | 'release'
      >
    > & { manager: MockEntityManager };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      queryRunner,
    };
    osRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrdemServicoEntity>>;
    emitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;
    paginationService = new PaginationService();

    service = new OrdemServicoService(
      osRepo,
      dataSource as unknown as DataSource,
      emitter,
      paginationService,
    );
  });

  describe('criar', () => {
    it('cria OS com status Recebida, reserva peças e calcula valor_total', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      const srv = servico(1, 150);
      const est = estoque(7, 5, 0, 30);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unused-vars
      em.findOne.mockImplementation((E: unknown, _opts: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === ServicoEntity) return Promise.resolve(srv);
        if (E === EstoqueEntity) return Promise.resolve(est);
        return Promise.resolve(null);
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      em.save.mockImplementation((E: unknown, data: unknown) => ({
        ...data,
        id: 'os-123',
      }));

      const result = await service.criar({
        documentoCliente: cli.documento,
        veiculoId: vei.id,
        observacao: 'teste',
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 7, quantidade: 2 }],
      });

      expect(result.status).toBe(S.Recebida);
      expect(Number(result.valorTotal)).toBeCloseTo(150 + 2 * 30, 2);
      expect(est.quantidadeReservada).toBe(2);
      expect(dataSource.queryRunner.commitTransaction).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.status.alterado',
        expect.objectContaining({
          statusAnterior: null,
          statusNovo: S.Recebida,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.criada',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ osId: expect.anything() }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledTimes(2);
    });

    it('lança 404 quando cliente não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === ClienteEntity ? Promise.resolve(null) : Promise.resolve({}),
      );
      await expect(
        service.criar({
          documentoCliente: fakeCpf(false),
          veiculoId: 'vei-1',
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('lança 409 quando o veículo é de outro cliente', async () => {
      const cli = cliente({ id: 'cli-1' });
      const vei = veiculo({ cliente_id: 'outro-cli' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        return Promise.resolve(null);
      });
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          veiculoId: vei.id,
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(ConflictException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('lança 400 quando estoque é insuficiente (rollback)', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      const est = estoque(7, 1, 1, 30); // 0 disponível
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === EstoqueEntity) return Promise.resolve(est);
        if (E === ServicoEntity) return Promise.resolve(servico());
        return Promise.resolve(null);
      });
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          veiculoId: vei.id,
          itensServico: [],
          itensPeca: [{ estoqueId: 7, quantidade: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('lança 400 quando OS não tem nenhum item', async () => {
      await expect(
        service.criar({
          documentoCliente: fakeCpf(false),
          veiculoId: 'vei-1',
          itensServico: [],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transições simples', () => {
    const setupOs = (status: S) => {
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status,
        cliente_id: 'cli-1',
        veiculo_id: 'vei-1',
        valorTotal: 100,
        itensServico: [],
        itensPeca: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      return os;
    };

    it('iniciarDiagnostico move Recebida → EmDiagnostico e emite eventos', async () => {
      const os = setupOs(S.Recebida);
      await service.iniciarDiagnostico('os-1');
      expect(os.status).toBe(S.EmDiagnostico);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.status.alterado',
        expect.objectContaining({
          statusAnterior: S.Recebida,
          statusNovo: S.EmDiagnostico,
        }),
      );
    });

    it('finalizar move EmExecucao → Finalizada', async () => {
      const os = setupOs(S.EmExecucao);
      await service.finalizar('os-1');
      expect(os.status).toBe(S.Finalizada);
    });

    it('entregar move Finalizada → Entregue', async () => {
      const os = setupOs(S.Finalizada);
      await service.entregar('os-1');
      expect(os.status).toBe(S.Entregue);
    });

    it('cancelar move Reprovada → Cancelada', async () => {
      const os = setupOs(S.Reprovada);
      await service.cancelar('os-1');
      expect(os.status).toBe(S.Cancelada);
    });

    it('avancarStatus genérico aceita transição válida', async () => {
      const os = setupOs(S.AguardandoServico);
      await service.avancarStatus('os-1', S.EmExecucao);
      expect(os.status).toBe(S.EmExecucao);
    });

    it('avancarStatus rejeita transição inválida', async () => {
      setupOs(S.Recebida);
      await expect(service.avancarStatus('os-1', S.Entregue)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança 404 quando a OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockResolvedValue(null);
      await expect(service.iniciarDiagnostico('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('gerarOrcamento', () => {
    it('move EmDiagnostico → AguardandoAprovacao e recalcula valor_total', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        valorTotal: 0,
        itensServico: [
          Object.assign(new ItemOsServicoEntity(), { precoAplicado: 100 }),
        ],
        itensPeca: [
          Object.assign(new ItemOsEstoqueEntity(), {
            precoAplicado: 20,
            quantidade: 3,
          }),
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await service.gerarOrcamento('os-1');
      expect(os.status).toBe(S.AguardandoAprovacao);
      expect(Number(os.valorTotal)).toBeCloseTo(100 + 60, 2);
    });

    it('rejeita quando OS está fora de EmDiagnostico', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.Recebida,
        itensServico: [],
        itensPeca: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await expect(service.gerarOrcamento('os-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('aprovarOrcamento', () => {
    const buildOs = (todasDisponiveis: boolean) => {
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.AguardandoAprovacao,
        itensServico: [],
        valorTotal: 100,
        itensPeca: [
          Object.assign(new ItemOsEstoqueEntity(), {
            disponivelNoDiagnostico: true,
            quantidade: 1,
            precoAplicado: 10,
          }),
          Object.assign(new ItemOsEstoqueEntity(), {
            disponivelNoDiagnostico: todasDisponiveis,
            quantidade: 1,
            precoAplicado: 10,
          }),
        ],
      });
      return os;
    };

    it('todas peças disponíveis → AguardandoAprovacao → Aprovada → AguardandoServico', async () => {
      const os = buildOs(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await service.aprovarOrcamento('os-1');
      expect(os.status).toBe(S.AguardandoServico);
      const calls = (emitter.emit as jest.Mock).mock.calls.filter(
        ([name]) => name === 'os.status.alterado',
      );
      expect(calls).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(calls[0][1]).toMatchObject({
        statusAnterior: S.AguardandoAprovacao,
        statusNovo: S.Aprovada,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(calls[1][1]).toMatchObject({
        statusAnterior: S.Aprovada,
        statusNovo: S.AguardandoServico,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.orcamento.aprovado',
        expect.objectContaining({ osId: 'os-1' }),
      );
    });

    it('com peça em falta → ... → AguardandoPecasInsumos', async () => {
      const os = buildOs(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await service.aprovarOrcamento('os-1');
      expect(os.status).toBe(S.AguardandoPecasInsumos);
    });

    it('rejeita se status não for AguardandoAprovacao', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, { id: 'os-1', status: S.Recebida, itensPeca: [] });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await expect(service.aprovarOrcamento('os-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reprovarOrcamento', () => {
    it('estorna reservas de cada peça e move para Reprovada', async () => {
      const peca = estoque(7, 10, 3, 30); // 3 reservadas
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 3,
        peca,
        estoque_id: 7,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.AguardandoAprovacao,
        itensServico: [],
        itensPeca: [itemPeca],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === OrdemServicoEntity) return Promise.resolve(os);
        if (E === EstoqueEntity) return Promise.resolve(peca);
        return Promise.resolve(null);
      });
      await service.reprovarOrcamento('os-1');
      expect(os.status).toBe(S.Reprovada);
      expect(peca.quantidadeReservada).toBe(0); // 3 - 3
    });
  });

  describe('iniciarExecucao', () => {
    it('move AguardandoServico → EmExecucao e dá baixa em cada peça', async () => {
      const peca = estoque(7, 10, 3, 30);
      const item = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 2,
        peca,
        estoque_id: 7,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.AguardandoServico,
        itensPeca: [item],
        itensServico: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === OrdemServicoEntity) return Promise.resolve(os);
        if (E === EstoqueEntity) return Promise.resolve(peca);
        return Promise.resolve(null);
      });
      await service.iniciarExecucao('os-1');
      expect(os.status).toBe(S.EmExecucao);
      expect(peca.quantidadeFisica).toBe(8); // 10 - 2
      expect(peca.quantidadeReservada).toBe(1); // 3 - 2
    });
  });

  describe('findAll', () => {
    it('aplica filtros e retorna { data, meta } paginado', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({
        page: 1,
        take: 5,
        status: S.EmExecucao,
        clienteId: 'cli-1',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(qb.andWhere).toHaveBeenCalledWith('os.status = :status', {
        status: S.EmExecucao,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(qb.andWhere).toHaveBeenCalledWith('os.cliente_id = :clienteId', {
        clienteId: 'cli-1',
      });
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(5);
    });

    it('aplica os filtros de data quando presentes', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({
        page: 1,
        take: 10,
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(qb.andWhere).toHaveBeenCalledWith('os.createdAt >= :dataInicio', {
        dataInicio: '2026-04-01',
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(qb.andWhere).toHaveBeenCalledWith('os.createdAt <= :dataFim', {
        dataFim: '2026-04-30',
      });
    });

    it('usa defaults quando page/take ausentes', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as unknown as ReturnType<
        Repository<OrdemServicoEntity>['createQueryBuilder']
      >;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({});
      expect(result.meta.itemsPerPage).toBe(10); // DefaultPageSize.ORDEM_SERVICO
      expect(result.meta.currentPage).toBe(1);
    });
  });

  describe('findOne', () => {
    it('retorna OS com relations carregados', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, { id: 'os-1' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findOne('os-1');
      expect(result).toBe(os);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(osRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'os-1' },
          relations: expect.arrayContaining([
            'cliente',
            'veiculo',
            'itensServico',
            'itensServico.servico',
            'itensPeca',
            'itensPeca.peca',
          ]),
        }),
      );
    });

    it('lança 404 quando não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
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
      const ds = service as unknown as {
        dataSource: { getRepository: jest.Mock };
      };
      ds.dataSource.getRepository = jest.fn().mockReturnValue(histRepo);

      const os = new OrdemServicoEntity();
      Object.assign(os, { id: 'os-1' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findHistorico('os-1');
      expect(result).toBe(histEntries);
      expect(histRepo.find).toHaveBeenCalledWith({
        where: { os_id: 'os-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('propaga 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (osRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findHistorico('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
