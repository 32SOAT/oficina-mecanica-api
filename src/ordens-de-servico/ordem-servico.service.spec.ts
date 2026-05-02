/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

describe('OrdemServicoService', () => {
  let service: OrdemServicoService;
  let osRepo: jest.Mocked<Repository<OrdemServicoEntity>>;
  let dataSource: { createQueryRunner: jest.Mock; queryRunner: any };
  let em: any;
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
      save: jest.fn(async (_e: unknown, x: unknown) => x),
      create: jest.fn((_E: unknown, data: unknown) => data),
    };
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: em,
    };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      queryRunner,
    };
    osRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;
    emitter = { emit: jest.fn() } as any;
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
      em.findOne.mockImplementation((E: unknown, _opts: unknown) => {
        if (E === ClienteEntity) return Promise.resolve(cli);
        if (E === VeiculoEntity) return Promise.resolve(vei);
        if (E === ServicoEntity) return Promise.resolve(srv);
        if (E === EstoqueEntity) return Promise.resolve(est);
        return Promise.resolve(null);
      });
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
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.status.alterado',
        expect.objectContaining({
          statusAnterior: null,
          statusNovo: S.Recebida,
        }),
      );
      expect(emitter.emit).toHaveBeenCalledWith(
        'os.criada',
        expect.objectContaining({ osId: expect.anything() }),
      );
      expect(emitter.emit).toHaveBeenCalledTimes(2);
    });

    it('lança 404 quando cliente não existe', async () => {
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
});
