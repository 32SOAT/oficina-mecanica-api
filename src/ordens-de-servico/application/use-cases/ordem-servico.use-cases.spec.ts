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
import type { OrdemServicoRepository } from '../ports/ordem-servico.repository';

const osOutput = { id: 'os-id', status: StatusOrdemServico.Recebida } as never;

describe('Ordem servico use cases', () => {
  const repository = {
    criar: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findHistorico: jest.fn(),
    transicionar: jest.fn(),
    substituirItensEmDiagnostico: jest.fn(),
    gerarOrcamento: jest.fn(),
    aprovarOrcamento: jest.fn(),
    reprovarOrcamento: jest.fn(),
    iniciarExecucao: jest.fn(),
    tentarLiberarOsAposReposicaoEstoque: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('CreateOrdemServicoUseCase delegates to repository', async () => {
    repository.criar.mockResolvedValue(osOutput);
    const useCase = new CreateOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    const input = { veiculoId: 'v1', descricao: 'Barulho' } as never;
    await expect(useCase.execute(input, 'user-id')).resolves.toEqual(osOutput);
    expect(repository.criar).toHaveBeenCalledWith(input, 'user-id');
  });

  it('FindAllOrdensServicoUseCase delegates to repository', async () => {
    repository.findAll.mockResolvedValue({ data: [osOutput], meta: {} });
    const useCase = new FindAllOrdensServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    const input = { page: 1, take: 10 } as never;
    await expect(useCase.execute(input)).resolves.toEqual({
      data: [osOutput],
      meta: {},
    });
  });

  it('FindOrdemServicoByIdUseCase delegates to repository', async () => {
    repository.findById.mockResolvedValue(osOutput);
    const useCase = new FindOrdemServicoByIdUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id')).resolves.toEqual(osOutput);
  });

  it('FindOrdemServicoHistoricoUseCase delegates to repository', async () => {
    repository.findHistorico.mockResolvedValue([]);
    const useCase = new FindOrdemServicoHistoricoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id')).resolves.toEqual([]);
  });

  it('TransicionarOrdemServicoUseCase delegates to repository', async () => {
    repository.transicionar.mockResolvedValue(osOutput);
    const useCase = new TransicionarOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(
      useCase.execute('os-id', StatusOrdemServico.EmDiagnostico, 'user-id'),
    ).resolves.toEqual(osOutput);
  });

  it('SubstituirItensOrdemServicoUseCase delegates to repository', async () => {
    repository.substituirItensEmDiagnostico.mockResolvedValue(osOutput);
    const useCase = new SubstituirItensOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    const input = { servicos: [], estoque: [] } as never;
    await expect(useCase.execute('os-id', input, 'user-id')).resolves.toEqual(
      osOutput,
    );
    expect(repository.substituirItensEmDiagnostico).toHaveBeenCalledWith(
      'os-id',
      input,
      'user-id',
    );
  });

  it('GerarOrcamentoOrdemServicoUseCase delegates to repository', async () => {
    repository.gerarOrcamento.mockResolvedValue(osOutput);
    const useCase = new GerarOrcamentoOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
  });

  it('AprovarOrcamentoOrdemServicoUseCase delegates to repository', async () => {
    repository.aprovarOrcamento.mockResolvedValue(osOutput);
    const useCase = new AprovarOrcamentoOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
  });

  it('ReprovarOrcamentoOrdemServicoUseCase delegates to repository', async () => {
    repository.reprovarOrcamento.mockResolvedValue(osOutput);
    const useCase = new ReprovarOrcamentoOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
  });

  it('IniciarExecucaoOrdemServicoUseCase delegates to repository', async () => {
    repository.iniciarExecucao.mockResolvedValue(osOutput);
    const useCase = new IniciarExecucaoOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await expect(useCase.execute('os-id', 'user-id')).resolves.toEqual(
      osOutput,
    );
  });

  it('TentarLiberarOsAposReposicaoEstoqueUseCase delegates to repository', async () => {
    repository.tentarLiberarOsAposReposicaoEstoque.mockResolvedValue(undefined);
    const useCase = new TentarLiberarOsAposReposicaoEstoqueUseCase(
      repository as unknown as OrdemServicoRepository,
    );
    await useCase.execute([1], 'user-id');
    expect(
      repository.tentarLiberarOsAposReposicaoEstoque,
    ).toHaveBeenCalledWith([1], 'user-id');
  });

  describe('AvancarStatusOrdemServicoUseCase', () => {
    const useCase = new AvancarStatusOrdemServicoUseCase(
      repository as unknown as OrdemServicoRepository,
    );

    it('routes aprovada to aprovarOrcamento', async () => {
      repository.aprovarOrcamento.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Aprovada, 'user-id');
      expect(repository.aprovarOrcamento).toHaveBeenCalledWith(
        'os-id',
        'user-id',
      );
    });

    it('routes reprovada to reprovarOrcamento', async () => {
      repository.reprovarOrcamento.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Reprovada, 'user-id');
      expect(repository.reprovarOrcamento).toHaveBeenCalled();
    });

    it('routes em execucao to iniciarExecucao', async () => {
      repository.iniciarExecucao.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.EmExecucao, 'user-id');
      expect(repository.iniciarExecucao).toHaveBeenCalled();
    });

    it('falls back to transicionar', async () => {
      repository.transicionar.mockResolvedValue(osOutput);
      await useCase.execute('os-id', StatusOrdemServico.Finalizada, 'user-id');
      expect(repository.transicionar).toHaveBeenCalledWith(
        'os-id',
        StatusOrdemServico.Finalizada,
        'user-id',
      );
    });
  });
});
