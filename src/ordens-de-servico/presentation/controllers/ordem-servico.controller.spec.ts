import { OrdemServicoController } from './ordem-servico.controller';
import { StatusOrdemServico as S } from '../../domain/status-ordem-servico.enum';
import { type AuthenticatedRequest } from '../../../auth/authenticated-request.interface';

const mockReq = {
  user: { sub: 'usuario-1', email: 'a@b.c', username: 'admin' },
} as unknown as AuthenticatedRequest;

const mockUseCase = () => ({ execute: jest.fn() });

describe('OrdemServicoController', () => {
  let controller: OrdemServicoController;
  const createOrdemServicoUseCase = mockUseCase();
  const findAllOrdensServicoUseCase = mockUseCase();
  const findOrdemServicoByIdUseCase = mockUseCase();
  const findOrdemServicoHistoricoUseCase = mockUseCase();
  const transicionarOrdemServicoUseCase = mockUseCase();
  const substituirItensOrdemServicoUseCase = mockUseCase();
  const gerarOrcamentoOrdemServicoUseCase = mockUseCase();
  const aprovarOrcamentoOrdemServicoUseCase = mockUseCase();
  const reprovarOrcamentoOrdemServicoUseCase = mockUseCase();
  const iniciarExecucaoOrdemServicoUseCase = mockUseCase();
  const avancarStatusOrdemServicoUseCase = mockUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OrdemServicoController(
      createOrdemServicoUseCase as never,
      findAllOrdensServicoUseCase as never,
      findOrdemServicoByIdUseCase as never,
      findOrdemServicoHistoricoUseCase as never,
      transicionarOrdemServicoUseCase as never,
      substituirItensOrdemServicoUseCase as never,
      gerarOrcamentoOrdemServicoUseCase as never,
      aprovarOrcamentoOrdemServicoUseCase as never,
      reprovarOrcamentoOrdemServicoUseCase as never,
      iniciarExecucaoOrdemServicoUseCase as never,
      avancarStatusOrdemServicoUseCase as never,
    );
  });

  it('PATCH /ordens/:id/itens delega ao use case', async () => {
    substituirItensOrdemServicoUseCase.execute.mockResolvedValue({
      id: 'os-1',
    });
    const dto = { itensServico: [{ servicoId: 1 }], itensPeca: [] };
    const result = await controller.substituirItensEmDiagnostico(
      mockReq,
      'os-1',
      dto,
    );
    expect(substituirItensOrdemServicoUseCase.execute).toHaveBeenCalledWith(
      'os-1',
      dto,
      'usuario-1',
    );
    expect(result).toEqual({ id: 'os-1' });
  });

  it('POST /ordens delega ao use case', async () => {
    createOrdemServicoUseCase.execute.mockResolvedValue({ id: 'os-1' });
    const dto = {
      documentoCliente: '12345678901',
      placa: 'ABC1D23',
      itensServico: [],
      itensPeca: [{ estoqueId: 1, quantidade: 1 }],
    };
    const result = await controller.criar(mockReq, dto);
    expect(createOrdemServicoUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual({ id: 'os-1' });
  });

  it('GET /ordens delega filtros', async () => {
    findAllOrdensServicoUseCase.execute.mockResolvedValue({
      data: [],
      meta: {},
    });
    await controller.listar({ page: 1, take: 10 });
    expect(findAllOrdensServicoUseCase.execute).toHaveBeenCalled();
  });

  it('GET /ordens/:id delega para findById', async () => {
    findOrdemServicoByIdUseCase.execute.mockResolvedValue({ id: 'os-1' });
    await controller.detalhar('os-1');
    expect(findOrdemServicoByIdUseCase.execute).toHaveBeenCalledWith('os-1');
  });

  it('GET /ordens/:id/historico delega', async () => {
    findOrdemServicoHistoricoUseCase.execute.mockResolvedValue([]);
    await controller.historico('os-1');
    expect(findOrdemServicoHistoricoUseCase.execute).toHaveBeenCalledWith(
      'os-1',
    );
  });

  it('POST avancar-status delega novoStatus com usuarioId', async () => {
    avancarStatusOrdemServicoUseCase.execute.mockResolvedValue({});
    await controller.avancar(mockReq, 'os-1', { novoStatus: S.Entregue });
    expect(avancarStatusOrdemServicoUseCase.execute).toHaveBeenCalledWith(
      'os-1',
      S.Entregue,
      'usuario-1',
    );
  });
});
