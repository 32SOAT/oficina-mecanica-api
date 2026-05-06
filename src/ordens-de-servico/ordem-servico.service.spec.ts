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
    'findOne' | 'findOneBy' | 'find' | 'save' | 'create' | 'softRemove'
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
      softRemove: jest.fn().mockResolvedValue(undefined),
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
      find: jest.fn(),
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
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
        placa: vei.placa,
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
      const emitCalls = (emitter.emit as jest.Mock).mock.calls as unknown[][];
      const osCriadaCall = emitCalls.find((call) => call[0] === 'os.criada');
      const payload = (
        osCriadaCall && osCriadaCall.length > 1 ? osCriadaCall[1] : {}
      ) as { osId?: string };
      expect(typeof payload.osId).toBe('string');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledTimes(2);
    });

    it('propaga usuarioId para o StatusAlteradoEvent', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === ServicoEntity) return Promise.resolve(servico());
        return Promise.resolve(null);
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.save.mockImplementation((_E: unknown, x: unknown) =>
        Promise.resolve({ ...(x as object), id: 'os-saved-id' }),
      );

      await service.criar(
        {
          documentoCliente: cli.documento,
          placa: vei.placa,
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        },
        'usuario-x',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.status.alterado',
        expect.objectContaining({ usuarioId: 'usuario-x' }),
      );
    });

    it('lança 404 quando cliente não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === ClienteEntity ? Promise.resolve(null) : Promise.resolve({}),
      );
      await expect(
        service.criar({
          documentoCliente: fakeCpf(false),
          placa: 'ABC1D23',
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
          placa: vei.placa,
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(ConflictException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('com peça indisponível: compromete reserva mesmo sem físico e observação avisa compra', async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      em.save.mockImplementation((E: unknown, data: unknown) => ({
        ...data,
        id: 'os-sem-reserva',
      }));

      const result = await service.criar({
        documentoCliente: cli.documento,
        placa: vei.placa,
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 7, quantidade: 5 }],
      });

      expect(est.quantidadeReservada).toBe(6);
      expect(est.quantidadeFisica - est.quantidadeReservada).toBeLessThan(0);
      expect(result.observacao).toContain(
        'Será necessário aguardar a compra de uma ou mais peças/insumos',
      );
      expect(dataSource.queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('compromete reserva mesmo com disponível menor que solicitado e mantém texto da observação', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      const srv = servico(1, 80);
      const est = estoque(7, 10, 8, 12); // 2 disponíveis, pedindo 5
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === ServicoEntity) return Promise.resolve(srv);
        if (E === EstoqueEntity) return Promise.resolve(est);
        return Promise.resolve(null);
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      em.save.mockImplementation((E: unknown, data: unknown) => ({
        ...data,
        id: 'os-parcial',
      }));

      const result = await service.criar({
        documentoCliente: cli.documento,
        placa: vei.placa,
        observacao: 'Cliente aguardando',
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 7, quantidade: 5 }],
      });

      expect(est.quantidadeReservada).toBe(13);
      expect(est.quantidadeDisponivel).toBeLessThan(0);
      expect(result.observacao).toContain('Cliente aguardando');
      expect(result.observacao).toContain(
        'Será necessário aguardar a compra de uma ou mais peças/insumos',
      );
      expect(Number(result.valorTotal)).toBeCloseTo(80 + 5 * 12, 2);
    });

    it('lança 400 quando OS não tem nenhum item', async () => {
      await expect(
        service.criar({
          documentoCliente: fakeCpf(false),
          placa: 'ABC1D23',
          itensServico: [],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança 400 quando CPF/CNPJ é inválido', async () => {
      await expect(
        service.criar({
          documentoCliente: '00000000000',
          placa: 'ABC1D23',
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança 400 quando placa é inválida', async () => {
      const cli = cliente();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === ClienteEntity ? Promise.resolve(cli) : Promise.resolve(null),
      );
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          placa: 'INVALIDO!',
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança 404 quando veículo não existe', async () => {
      const cli = cliente();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          placa: 'ABC1D23',
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('lança 404 quando serviço não existe', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === ServicoEntity) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          placa: vei.placa,
          itensServico: [{ servicoId: 99 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('lança 404 quando peça não existe no estoque', async () => {
      const cli = cliente();
      const vei = veiculo({ cliente_id: cli.id });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === EstoqueEntity) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      await expect(
        service.criar({
          documentoCliente: cli.documento,
          placa: vei.placa,
          itensServico: [],
          itensPeca: [{ estoqueId: 99, quantidade: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
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

    it('avancarStatus para Aprovada segue fluxo completo de aprovação', async () => {
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
            disponivelNoDiagnostico: true,
            quantidade: 1,
            precoAplicado: 10,
          }),
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );

      await service.avancarStatus('os-1', S.Aprovada);

      expect(os.status).toBe(S.AguardandoServico);
      const statusEvents = (emitter.emit as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === 'os.status.alterado',
      );
      expect(statusEvents).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(statusEvents[0][1]).toMatchObject({
        statusAnterior: S.AguardandoAprovacao,
        statusNovo: S.Aprovada,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(statusEvents[1][1]).toMatchObject({
        statusAnterior: S.Aprovada,
        statusNovo: S.AguardandoServico,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.orcamento.aprovado',
        expect.objectContaining({ osId: 'os-1' }),
      );
    });

    it('avancarStatus para Aprovada vai para AguardandoPecasInsumos quando faltar peça', async () => {
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
            disponivelNoDiagnostico: false,
            quantidade: 1,
            precoAplicado: 10,
          }),
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );

      await service.avancarStatus('os-1', S.Aprovada);

      expect(os.status).toBe(S.AguardandoPecasInsumos);
      const statusEvents = (emitter.emit as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === 'os.status.alterado',
      );
      expect(statusEvents).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(statusEvents[0][1]).toMatchObject({
        statusAnterior: S.AguardandoAprovacao,
        statusNovo: S.Aprovada,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(statusEvents[1][1]).toMatchObject({
        statusAnterior: S.Aprovada,
        statusNovo: S.AguardandoPecasInsumos,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.orcamento.aprovado',
        expect.objectContaining({ osId: 'os-1' }),
      );
    });

    it('avancarStatus para Reprovada estorna reservas de estoque', async () => {
      const peca = estoque(7, 10, 3, 30);
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 3,
        disponivelNoDiagnostico: true,
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

      await service.avancarStatus('os-1', S.Reprovada);

      expect(os.status).toBe(S.Reprovada);
      expect(peca.quantidadeReservada).toBe(0);
    });

    it('avancarStatus rejeita transição inválida', async () => {
      setupOs(S.Recebida);
      await expect(service.avancarStatus('os-1', S.Entregue)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança 404 quando a OS não existe', async () => {
      (em.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));
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

    it('lança 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );
      await expect(service.gerarOrcamento('os-x')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('emite OrcamentoGeradoEvent após commit', async () => {
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        valorTotal: 0,
        itensServico: [],
        itensPeca: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity ? Promise.resolve(os) : Promise.resolve(null),
      );
      await service.gerarOrcamento('os-1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.orcamento.gerado',
        expect.objectContaining({ osId: 'os-1' }),
      );
    });
  });

  describe('substituirItensEmDiagnostico', () => {
    it('lança 400 sem nenhum item', async () => {
      await expect(
        service.substituirItensEmDiagnostico('os-1', {
          itensServico: [],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando OS não está em diagnóstico', async () => {
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
      await expect(
        service.substituirItensEmDiagnostico('os-1', {
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('estorna reservas, remove itens antigos e retorna OS detalhada', async () => {
      const peca = estoque(7, 20, 4, 10);
      const oldItem = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 2,
        disponivelNoDiagnostico: true,
        estoque_id: 7,
        peca,
      });
      const oldSrvItem = Object.assign(new ItemOsServicoEntity(), {
        precoAplicado: 99,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        itensServico: [oldSrvItem],
        itensPeca: [oldItem],
      });
      const srv = servico(1, 150);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === OrdemServicoEntity) return Promise.resolve(os);
        if (E === EstoqueEntity) return Promise.resolve(peca);
        if (E === ServicoEntity) return Promise.resolve(srv);
        return Promise.resolve(null);
      });
      const detalheOut = Object.assign(new OrdemServicoEntity(), {
        id: 'os-1',
        cliente: cliente(),
      });
      (osRepo.findOne as jest.Mock).mockResolvedValue(detalheOut);

      const result = await service.substituirItensEmDiagnostico('os-1', {
        itensServico: [{ servicoId: 1 }],
        itensPeca: [],
      });

      expect(peca.quantidadeReservada).toBe(2);

      expect(em.softRemove).toHaveBeenCalledTimes(2);
      expect(Number(os.valorTotal)).toBeCloseTo(150, 2);
      expect(os.itensServico).toHaveLength(1);
      expect(os.itensPeca).toHaveLength(0);
      expect(result).toBe(detalheOut);
      expect(dataSource.queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('acrescenta aviso na observação quando nova peça não tem estoque', async () => {
      const peca = estoque(7, 10, 10, 25);
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        observacao: 'Nota inicial',
        itensServico: [],
        itensPeca: [],
      });
      const srv = servico(1, 100);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === OrdemServicoEntity) return Promise.resolve(os);
        if (E === EstoqueEntity) return Promise.resolve(peca);
        if (E === ServicoEntity) return Promise.resolve(srv);
        return Promise.resolve(null);
      });
      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      await service.substituirItensEmDiagnostico('os-1', {
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 7, quantidade: 3 }],
      });

      expect(os.observacao).toContain('Nota inicial');
      expect(os.observacao).toContain(
        'Será necessário aguardar a compra de uma ou mais peças/insumos',
      );
      expect(peca.quantidadeReservada).toBe(13);
      expect(os.itensPeca?.[0]?.disponivelNoDiagnostico).toBe(false);
    });

    it('remove aviso na observação se todos os novos itens têm estoque', async () => {
      const aviso =
        'Será necessário aguardar a compra de uma ou mais peças/insumos para atender esta ordem de serviço.';
      const pecaCheia = estoque(7, 100, 0, 10);
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        observacao: aviso,
        itensServico: [],
        itensPeca: [],
      });
      const srv = servico(1, 40);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) => {
        if (E === OrdemServicoEntity) return Promise.resolve(os);
        if (E === ServicoEntity) return Promise.resolve(srv);
        if (E === EstoqueEntity) return Promise.resolve(pecaCheia);
        return Promise.resolve(null);
      });
      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      await service.substituirItensEmDiagnostico('os-1', {
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 7, quantidade: 2 }],
      });

      expect(os.observacao).toBeNull();
      expect(pecaCheia.quantidadeReservada).toBe(2);
      expect(os.itensPeca?.[0]?.disponivelNoDiagnostico).toBe(true);
    });

    it('lança 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );
      await expect(
        service.substituirItensEmDiagnostico('os-x', {
          itensServico: [{ servicoId: 1 }],
          itensPeca: [],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('estorna reserva ignora SKU removido ao varrer itens antigos', async () => {
      const pecaNova = estoque(8, 20, 0, 9);
      const oldItem = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 4,
        disponivelNoDiagnostico: true,
        estoque_id: 777,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.EmDiagnostico,
        itensServico: [],
        itensPeca: [oldItem],
      });
      const srv = servico(1, 80);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (E: unknown, opts?: { where?: { id?: number } }) => {
          if (E === OrdemServicoEntity) return Promise.resolve(os);
          if (E === EstoqueEntity && opts?.where?.id === 777) {
            return Promise.resolve(null);
          }
          if (E === EstoqueEntity && opts?.where?.id === 8) {
            return Promise.resolve(pecaNova);
          }
          if (E === ServicoEntity) return Promise.resolve(srv);
          return Promise.resolve(null);
        },
      );
      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      await service.substituirItensEmDiagnostico('os-1', {
        itensServico: [{ servicoId: 1 }],
        itensPeca: [{ estoqueId: 8, quantidade: 1 }],
      });

      expect(pecaNova.quantidadeReservada).toBe(1);
      expect(os.itensPeca).toHaveLength(1);
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

    it('com item pendente e estoque já reposto no SKU → ... → AguardandoServico', async () => {
      const aviso =
        'Será necessário aguardar a compra de uma ou mais peças/insumos para atender esta ordem de serviço.';
      const os = buildOs(false);
      os.itensPeca[1].estoque_id = 7;
      os.observacao = `${aviso}\n\nCliente ciente`;
      const peca = estoque(7, 20, 3, 10); // físico >= reservado
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (E: unknown, opts?: { where?: { id?: number } }) => {
          if (E === OrdemServicoEntity) return Promise.resolve(os);
          if (E === EstoqueEntity && opts?.where?.id === 7)
            return Promise.resolve(peca);
          return Promise.resolve(null);
        },
      );

      await service.aprovarOrcamento('os-1');

      expect(os.itensPeca[1].disponivelNoDiagnostico).toBe(true);
      expect(os.status).toBe(S.AguardandoServico);
      expect(os.observacao).toContain('Cliente ciente');
      expect(os.observacao).not.toContain(aviso);
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

    it('lança 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );
      await expect(service.aprovarOrcamento('os-x')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('reprovarOrcamento', () => {
    it('estorna reservas de cada peça e move para Reprovada', async () => {
      const peca = estoque(7, 10, 3, 30); // 3 reservadas
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 3,
        disponivelNoDiagnostico: true,
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

    it('lança 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );
      await expect(service.reprovarOrcamento('os-x')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('iniciarExecucao', () => {
    it('não dá baixa quando disponivelNoDiagnostico é false (sem reserva efetiva)', async () => {
      const peca = estoque(7, 10, 0, 30);
      const item = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 5,
        disponivelNoDiagnostico: false,
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
      expect(peca.quantidadeFisica).toBe(10);
    });

    it('move AguardandoServico → EmExecucao e dá baixa em cada peça', async () => {
      const peca = estoque(7, 10, 3, 30);
      const item = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 2,
        disponivelNoDiagnostico: true,
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

    it('lança 404 quando OS não existe', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );
      await expect(service.iniciarExecucao('os-x')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('não tenta dar baixa quando o cadastro de estoque não existe', async () => {
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 2,
        disponivelNoDiagnostico: true,
        estoque_id: 404,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-1',
        status: S.AguardandoServico,
        itensPeca: [itemPeca],
        itensServico: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (E: unknown, opts?: { where?: { id?: number } }) => {
          if (E === OrdemServicoEntity) return Promise.resolve(os);
          if (E === EstoqueEntity && opts?.where?.id === 404) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        },
      );
      await service.iniciarExecucao('os-1');
      expect(os.status).toBe(S.EmExecucao);
      const estoqueSaves = (em.save as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === EstoqueEntity,
      );
      expect(estoqueSaves).toHaveLength(0);
    });
  });

  describe('tentarLiberarOsAposReposicaoEstoque', () => {
    const qbReposicaoImpacto = () => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    });

    it('retorna sem consultar quando não há ids de estoque válidos', async () => {
      await service.tentarLiberarOsAposReposicaoEstoque([], null);
      await service.tentarLiberarOsAposReposicaoEstoque([0, -3], undefined);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(osRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('retorna quando o SQL não encontra OS pendentes', async () => {
      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.tentarLiberarOsAposReposicaoEstoque([7], null);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(osRepo.find).not.toHaveBeenCalled();
    });

    it('deduplica SKUs e IDs de OS vindos do raw query', async () => {
      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([
        { id: 'os-a' },
        { id: null },
        { id: 'os-a' },
      ]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'os-a' }]);
      (em.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await service.tentarLiberarOsAposReposicaoEstoque([9, 9, -1], null);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(osRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['id'],
          order: { createdAt: 'ASC' },
        }),
      );
    });

    it('ignora OS que já não está em AguardandoPecasInsumos ao processar reposição', async () => {
      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([{ id: 'sumiu' }]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'sumiu' }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation((E: unknown) =>
        E === OrdemServicoEntity
          ? Promise.resolve(null)
          : Promise.resolve(null),
      );

      await service.tentarLiberarOsAposReposicaoEstoque([1], null);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('marca linhas cobertas e avança para AguardandoServico quando físico honra reservas do SKU', async () => {
      const aviso =
        'Será necessário aguardar a compra de uma ou mais peças/insumos para atender esta ordem de serviço.';
      const peca = estoque(7, 20, 3, 15);
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 3,
        disponivelNoDiagnostico: false,
        estoque_id: 7,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-lib',
        status: S.AguardandoPecasInsumos,
        itensPeca: [itemPeca],
        itensServico: [],
        observacao: `${aviso}\n\nCliente ok`,
      });

      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([{ id: 'os-lib' }]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'os-lib' }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (E: unknown, opts?: { where?: { id?: string; status?: S } }) => {
          if (E === OrdemServicoEntity) {
            const w = opts?.where ?? {};
            if (w.id === 'os-lib' && w.status === S.AguardandoPecasInsumos) {
              return Promise.resolve(os);
            }
            return Promise.resolve(null);
          }
          if (E === EstoqueEntity) return Promise.resolve(peca);
          return Promise.resolve(null);
        },
      );

      await service.tentarLiberarOsAposReposicaoEstoque([7], 'usuario-rep');

      expect(itemPeca.disponivelNoDiagnostico).toBe(true);
      expect(peca.quantidadeReservada).toBe(3);
      expect(peca.quantidadeFisica).toBeGreaterThanOrEqual(
        peca.quantidadeReservada,
      );
      expect(os.status).toBe(S.AguardandoServico);
      expect(os.observacao).toContain('Cliente ok');
      expect(os.observacao).not.toContain(aviso);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.status.alterado',
        expect.objectContaining({
          statusAnterior: S.AguardandoPecasInsumos,
          statusNovo: S.AguardandoServico,
          usuarioId: 'usuario-rep',
        }),
      );
    });

    it('atualiza parcialmente e não altera status se ainda faltar cobertura de estoque', async () => {
      const peca7 = estoque(7, 10, 10, 12);
      const peca8 = estoque(8, 5, 10, 15);
      const item7 = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 10,
        disponivelNoDiagnostico: false,
        estoque_id: 7,
      });
      const item8 = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 10,
        disponivelNoDiagnostico: false,
        estoque_id: 8,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-partial',
        status: S.AguardandoPecasInsumos,
        itensPeca: [item7, item8],
        itensServico: [],
      });

      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([{ id: 'os-partial' }]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'os-partial' }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (
          E: unknown,
          opts?: { where?: { id?: string | number; status?: S } },
        ) => {
          if (E === OrdemServicoEntity) {
            const w = opts?.where ?? {};
            if (
              w.id === 'os-partial' &&
              w.status === S.AguardandoPecasInsumos
            ) {
              return Promise.resolve(os);
            }
          }
          if (E === EstoqueEntity) {
            const id = opts?.where?.id as number | undefined;
            if (id === 7) return Promise.resolve(peca7);
            if (id === 8) return Promise.resolve(peca8);
          }
          return Promise.resolve(null);
        },
      );

      await service.tentarLiberarOsAposReposicaoEstoque([7, 8], null);

      expect(os.status).toBe(S.AguardandoPecasInsumos);
      expect(item7.disponivelNoDiagnostico).toBe(true);
      expect(item8.disponivelNoDiagnostico).toBe(false);
      const alterados = (emitter.emit as jest.Mock).mock.calls.filter(
        (c: unknown[]) => c[0] === 'os.status.alterado',
      );
      expect(alterados).toHaveLength(0);
    });

    it('pula linha já disponível e conclui quando todas já estão cobertas', async () => {
      const peca = estoque(7, 50, 1, 11);
      const itemOk = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 1,
        disponivelNoDiagnostico: true,
        estoque_id: 7,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-skip-item',
        status: S.AguardandoPecasInsumos,
        itensPeca: [itemOk],
        itensServico: [],
      });

      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([{ id: 'os-skip-item' }]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'os-skip-item' }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (E: unknown, opts?: { where?: { id?: string; status?: S } }) => {
          if (E === OrdemServicoEntity) {
            const w = opts?.where ?? {};
            if (
              w.id === 'os-skip-item' &&
              w.status === S.AguardandoPecasInsumos
            ) {
              return Promise.resolve(os);
            }
          }
          return Promise.resolve(null);
        },
      );

      await service.tentarLiberarOsAposReposicaoEstoque([7], null);

      expect(peca.quantidadeReservada).toBe(1);
      expect(os.status).toBe(S.AguardandoServico);
    });

    it('não marca linha quando o SKU foi excluído do cadastro', async () => {
      const itemPeca = Object.assign(new ItemOsEstoqueEntity(), {
        quantidade: 4,
        disponivelNoDiagnostico: false,
        estoque_id: 991,
      });
      const os = new OrdemServicoEntity();
      Object.assign(os, {
        id: 'os-sem-sku',
        status: S.AguardandoPecasInsumos,
        itensPeca: [itemPeca],
        itensServico: [],
      });
      const qb = qbReposicaoImpacto();
      qb.getRawMany.mockResolvedValue([{ id: 'os-sem-sku' }]);
      (osRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (osRepo.find as jest.Mock).mockResolvedValue([{ id: 'os-sem-sku' }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      em.findOne.mockImplementation(
        (
          E: unknown,
          opts?: { where?: { id?: string | number; status?: S } },
        ) => {
          if (E === OrdemServicoEntity) {
            const w = opts?.where ?? {};
            if (
              w.id === 'os-sem-sku' &&
              w.status === S.AguardandoPecasInsumos
            ) {
              return Promise.resolve(os);
            }
          }
          if (E === EstoqueEntity && opts?.where?.id === 991) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        },
      );

      await service.tentarLiberarOsAposReposicaoEstoque([991], null);

      expect(itemPeca.disponivelNoDiagnostico).toBe(false);
      expect(os.status).toBe(S.AguardandoPecasInsumos);
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

      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findOne('os-1');
      expect(result).toBe(os);
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

      (osRepo.findOne as jest.Mock).mockResolvedValue(os);

      const result = await service.findHistorico('os-1');
      expect(result).toBe(histEntries);
      expect(histRepo.find).toHaveBeenCalledWith({
        where: { os_id: 'os-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('propaga 404 quando OS não existe', async () => {
      (osRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findHistorico('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
