import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { CreateOrdemServicoUseCase } from './create-ordem-servico.use-case';
import { FindAllOrdensServicoUseCase } from './find-all-ordens-servico.use-case';
import { FindOrdemServicoByIdUseCase } from './find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from './find-ordem-servico-historico.use-case';
import { TransicionarOrdemServicoUseCase } from './transicionar-ordem-servico.use-case';
import { SubstituirItensOrdemServicoUseCase } from './substituir-itens-ordem-servico.use-case';
import { GerarOrcamentoOrdemServicoUseCase } from './gerar-orcamento-ordem-servico.use-case';
import { AprovarOrcamentoOrdemServicoUseCase } from './aprovar-orcamento-ordem-servico.use-case';
import { ReprovarOrcamentoOrdemServicoUseCase } from './reprovar-orcamento-ordem-servico.use-case';
import { IniciarExecucaoOrdemServicoUseCase } from './iniciar-execucao-ordem-servico.use-case';
import { TentarLiberarOsAposReposicaoEstoqueUseCase } from './tentar-liberar-os-apos-reposicao-estoque.use-case';
import { AvancarStatusOrdemServicoUseCase } from './avancar-status-ordem-servico.use-case';
import type { OrdemServicoEventsPort } from '../ports/ordem-servico-events.port';
import type { OrdemServicoQueryPort } from '../ports/ordem-servico-query.port';
import type {
  OrdemServicoTransactionPort,
  OrdemServicoTransactionalOperations,
  OsWorkflowHandle,
} from '../ports/ordem-servico-transaction.port';

const osOutput = { id: 'os-id', status: StatusOrdemServico.Recebida } as never;

const validCreateInput = {
  documentoCliente: '39053344705',
  placa: 'ABC1D23',
  itensServico: [{ servicoId: 1 }],
  itensPeca: [],
};

const makeOsHandle = (
  overrides: Partial<OsWorkflowHandle> = {},
): OsWorkflowHandle => ({
  id: 'os-id',
  status: StatusOrdemServico.Recebida,
  observacao: null,
  valorTotal: 0,
  itensPeca: [],
  avancarStatus: jest.fn().mockReturnValue({
    anterior: StatusOrdemServico.Recebida,
    novo: StatusOrdemServico.EmDiagnostico,
  }),
  calcularValorTotal: jest.fn().mockReturnValue(100),
  todasPecasDisponiveis: jest.fn().mockReturnValue(true),
  ...overrides,
});

describe('Ordem servico use cases', () => {
  const query = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findHistorico: jest.fn(),
    findIdsAguardandoPecasPorEstoque: jest.fn(),
  };

  const events: jest.Mocked<OrdemServicoEventsPort> = {
    emitStatusAlterado: jest.fn(),
    emitOsCriada: jest.fn(),
    emitOrcamentoGerado: jest.fn(),
    emitOrcamentoAprovado: jest.fn(),
    emitOrcamentoReprovado: jest.fn(),
    emitOsEmExecucao: jest.fn(),
  };

  const txOps: jest.Mocked<OrdemServicoTransactionalOperations> = {
    findClienteIdByDocumento: jest.fn(),
    findVeiculoIdForCliente: jest.fn(),
    buildItensServico: jest.fn(),
    buildItensPecaWithReserva: jest.fn(),
    insertNewOs: jest.fn(),
    loadOs: jest.fn(),
    saveOs: jest.fn(),
    estornarReservasPecas: jest.fn(),
    softRemoveOsItens: jest.fn(),
    replaceItensInDiagnostico: jest.fn(),
    refreshValorTotal: jest.fn(),
    syncPecaDisponibilidadeAposAprovacao: jest.fn(),
    darBaixaPecasEmExecucao: jest.fn(),
    estornarReservasAoReprovar: jest.fn(),
    loadOsAguardandoPecasForUpdate: jest.fn(),
    syncPecasPendentesAposReposicao: jest.fn(),
  };

  const transaction: OrdemServicoTransactionPort = {
    runInTransaction: jest.fn(async (work) => work(txOps)),
  };

  beforeEach(() => jest.clearAllMocks());

  it('CreateOrdemServicoUseCase orchestrates transaction and emits events', async () => {
    txOps.findClienteIdByDocumento.mockResolvedValue('cli-1');
    txOps.findVeiculoIdForCliente.mockResolvedValue('vei-1');
    txOps.buildItensServico.mockResolvedValue([]);
    txOps.buildItensPecaWithReserva.mockResolvedValue({
      itens: [],
      pecaPrecisaObservacaoCompra: false,
    });
    txOps.insertNewOs.mockResolvedValue(osOutput);
    const useCase = new CreateOrdemServicoUseCase(transaction, events);
    await expect(
      useCase.execute(validCreateInput, 'user-id'),
    ).resolves.toEqual(osOutput);
    expect(events.emitOsCriada).toHaveBeenCalledWith('os-id');
    expect(events.emitStatusAlterado).toHaveBeenCalled();
  });

  it('CreateOrdemServicoUseCase mescla observação de compra e aceita usuarioId nulo', async () => {
    txOps.findClienteIdByDocumento.mockResolvedValue('cli-1');
    txOps.findVeiculoIdForCliente.mockResolvedValue('vei-1');
    txOps.buildItensServico.mockResolvedValue([]);
    txOps.buildItensPecaWithReserva.mockResolvedValue({
      itens: [{ estoqueId: 1, quantidade: 1, precoAplicado: 10, disponivelNoDiagnostico: false }],
      pecaPrecisaObservacaoCompra: true,
    });
    txOps.insertNewOs.mockResolvedValue(osOutput);

    const useCase = new CreateOrdemServicoUseCase(transaction, events);
    await useCase.execute(
      { ...validCreateInput, observacao: 'Urgente', itensPeca: [{ estoqueId: 1, quantidade: 1 }] },
      null,
    );

    expect(txOps.insertNewOs).toHaveBeenCalledWith(
      expect.objectContaining({
        observacao: expect.stringContaining('compra'),
      }),
    );
    expect(events.emitStatusAlterado).toHaveBeenCalledWith(
      'os-id',
      null,
      StatusOrdemServico.Recebida,
      null,
    );
  });

  it('FindAllOrdensServicoUseCase delegates to query port', async () => {
    query.findAll.mockResolvedValue({ data: [osOutput], meta: {} });
    const useCase = new FindAllOrdensServicoUseCase(
      query as unknown as OrdemServicoQueryPort,
    );
    const input = { page: 1, take: 10 } as never;
    await expect(useCase.execute(input)).resolves.toEqual({
      data: [osOutput],
      meta: {},
    });
  });

  it('FindOrdemServicoByIdUseCase delegates to query port', async () => {
    query.findById.mockResolvedValue(osOutput);
    const useCase = new FindOrdemServicoByIdUseCase(
      query as unknown as OrdemServicoQueryPort,
    );
    await expect(useCase.execute('os-id')).resolves.toEqual(osOutput);
  });

  it('FindOrdemServicoHistoricoUseCase delegates to query port', async () => {
    query.findHistorico.mockResolvedValue([]);
    const useCase = new FindOrdemServicoHistoricoUseCase(
      query as unknown as OrdemServicoQueryPort,
    );
    await expect(useCase.execute('os-id')).resolves.toEqual([]);
  });

  it('TransicionarOrdemServicoUseCase loads OS, transitions and emits', async () => {
    const handle = makeOsHandle();
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);
    const useCase = new TransicionarOrdemServicoUseCase(transaction, events);
    await expect(
      useCase.execute('os-id', StatusOrdemServico.EmDiagnostico, 'user-id'),
    ).resolves.toEqual(osOutput);
    expect(handle.avancarStatus).toHaveBeenCalledWith(
      StatusOrdemServico.EmDiagnostico,
    );
    expect(events.emitStatusAlterado).toHaveBeenCalled();
  });

  it('SubstituirItensOrdemServicoUseCase validates status and replaces in tx', async () => {
    query.findById
      .mockResolvedValueOnce({
        ...osOutput,
        status: StatusOrdemServico.EmDiagnostico,
      })
      .mockResolvedValueOnce(osOutput);
    const useCase = new SubstituirItensOrdemServicoUseCase(
      query as unknown as OrdemServicoQueryPort,
      transaction,
    );
    const input = {
      itensServico: [{ servicoId: 1 }],
      itensPeca: [],
    };
    await expect(useCase.execute('os-id', input, 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(txOps.replaceItensInDiagnostico).toHaveBeenCalledWith(
      'os-id',
      input,
    );
  });

  it('GerarOrcamentoOrdemServicoUseCase transitions and emits orcamento', async () => {
    const handle = makeOsHandle();
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);
    const useCase = new GerarOrcamentoOrdemServicoUseCase(transaction, events);
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(events.emitOrcamentoGerado).toHaveBeenCalledWith('os-id');
  });

  it('AprovarOrcamentoOrdemServicoUseCase syncs pecas and emits', async () => {
    const handle = makeOsHandle();
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);
    const useCase = new AprovarOrcamentoOrdemServicoUseCase(
      transaction,
      events,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(txOps.syncPecaDisponibilidadeAposAprovacao).toHaveBeenCalled();
    expect(events.emitOrcamentoAprovado).toHaveBeenCalledWith('os-id');
  });

  it('AprovarOrcamentoOrdemServicoUseCase vai para AguardandoPecasInsumos quando faltam peças', async () => {
    const handle = makeOsHandle({
      todasPecasDisponiveis: jest.fn().mockReturnValue(false),
      avancarStatus: jest
        .fn()
        .mockReturnValueOnce({
          anterior: StatusOrdemServico.AguardandoAprovacao,
          novo: StatusOrdemServico.Aprovada,
        })
        .mockReturnValueOnce({
          anterior: StatusOrdemServico.Aprovada,
          novo: StatusOrdemServico.AguardandoPecasInsumos,
        }),
    });
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);

    const useCase = new AprovarOrcamentoOrdemServicoUseCase(transaction, events);
    await useCase.execute('os-id', null);

    expect(handle.avancarStatus).toHaveBeenLastCalledWith(
      StatusOrdemServico.AguardandoPecasInsumos,
    );
    expect(events.emitStatusAlterado).toHaveBeenCalledTimes(2);
  });

  it('ReprovarOrcamentoOrdemServicoUseCase estorna reservas and emits', async () => {
    const handle = makeOsHandle();
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);
    const useCase = new ReprovarOrcamentoOrdemServicoUseCase(
      transaction,
      events,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(txOps.estornarReservasAoReprovar).toHaveBeenCalledWith(handle);
    expect(events.emitOrcamentoReprovado).toHaveBeenCalledWith('os-id');
  });

  it('IniciarExecucaoOrdemServicoUseCase gives baixa and emits', async () => {
    const handle = makeOsHandle();
    txOps.loadOs.mockResolvedValue(handle);
    txOps.saveOs.mockResolvedValue(osOutput);
    const useCase = new IniciarExecucaoOrdemServicoUseCase(transaction, events);
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(txOps.darBaixaPecasEmExecucao).toHaveBeenCalledWith(handle);
    expect(events.emitOsEmExecucao).toHaveBeenCalledWith('os-id');
  });

  it('TentarLiberarOsAposReposicaoEstoqueUseCase processes OS ids from query', async () => {
    query.findIdsAguardandoPecasPorEstoque.mockResolvedValue(['os-1']);
    txOps.loadOsAguardandoPecasForUpdate.mockResolvedValue(null);
    const useCase = new TentarLiberarOsAposReposicaoEstoqueUseCase(
      query as unknown as OrdemServicoQueryPort,
      transaction,
      events,
    );
    await useCase.execute([1], 'user-id');
    expect(query.findIdsAguardandoPecasPorEstoque).toHaveBeenCalledWith([1]);
    expect(txOps.loadOsAguardandoPecasForUpdate).toHaveBeenCalledWith('os-1');
  });

  it('TentarLiberarOsAposReposicaoEstoqueUseCase salva sem avançar quando faltam peças', async () => {
    const handle = makeOsHandle({
      todasPecasDisponiveis: jest.fn().mockReturnValue(false),
    });
    query.findIdsAguardandoPecasPorEstoque.mockResolvedValue(['os-1']);
    txOps.loadOsAguardandoPecasForUpdate.mockResolvedValue(handle);

    const useCase = new TentarLiberarOsAposReposicaoEstoqueUseCase(
      query as unknown as OrdemServicoQueryPort,
      transaction,
      events,
    );

    await useCase.execute([1], 'user-id');

    expect(txOps.syncPecasPendentesAposReposicao).toHaveBeenCalledWith(handle);
    expect(txOps.saveOs).toHaveBeenCalledWith(handle);
    expect(handle.avancarStatus).not.toHaveBeenCalled();
    expect(events.emitStatusAlterado).not.toHaveBeenCalled();
  });

  it('TentarLiberarOsAposReposicaoEstoqueUseCase avança status quando todas peças disponíveis', async () => {
    const handle = makeOsHandle({
      status: StatusOrdemServico.AguardandoPecasInsumos,
    });
    handle.avancarStatus = jest.fn().mockReturnValue({
      anterior: StatusOrdemServico.AguardandoPecasInsumos,
      novo: StatusOrdemServico.AguardandoServico,
    });
    query.findIdsAguardandoPecasPorEstoque.mockResolvedValue(['os-1']);
    txOps.loadOsAguardandoPecasForUpdate.mockResolvedValue(handle);

    const useCase = new TentarLiberarOsAposReposicaoEstoqueUseCase(
      query as unknown as OrdemServicoQueryPort,
      transaction,
      events,
    );

    await useCase.execute([1], null);

    expect(handle.avancarStatus).toHaveBeenCalledWith(
      StatusOrdemServico.AguardandoServico,
    );
    expect(events.emitStatusAlterado).toHaveBeenCalledWith(
      'os-id',
      StatusOrdemServico.AguardandoPecasInsumos,
      StatusOrdemServico.AguardandoServico,
      null,
    );
  });

  describe('AvancarStatusOrdemServicoUseCase', () => {
    const aprovar = { execute: jest.fn() };
    const reprovar = { execute: jest.fn() };
    const iniciar = { execute: jest.fn() };
    const transicionar = { execute: jest.fn() };
    const useCase = new AvancarStatusOrdemServicoUseCase(
      aprovar as never,
      reprovar as never,
      iniciar as never,
      transicionar as never,
    );

    it('routes aprovada to aprovarOrcamento', async () => {
      aprovar.execute.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Aprovada, 'user-id');
      expect(aprovar.execute).toHaveBeenCalledWith('os-id', 'user-id');
    });

    it('routes reprovada to reprovarOrcamento', async () => {
      reprovar.execute.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Reprovada, 'user-id');
      expect(reprovar.execute).toHaveBeenCalled();
    });

    it('routes em execucao to iniciarExecucao', async () => {
      iniciar.execute.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.EmExecucao, 'user-id');
      expect(iniciar.execute).toHaveBeenCalled();
    });

    it('falls back to transicionar', async () => {
      transicionar.execute.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Finalizada, 'user-id');
      expect(transicionar.execute).toHaveBeenCalledWith(
        'os-id',
        StatusOrdemServico.Finalizada,
        'user-id',
      );
    });
  });
});
