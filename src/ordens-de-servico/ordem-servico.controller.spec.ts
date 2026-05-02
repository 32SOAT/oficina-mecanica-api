/* eslint-disable @typescript-eslint/unbound-method */
import { OrdemServicoController } from './ordem-servico.controller';
import { OrdemServicoService } from './ordem-servico.service';
import { StatusOrdemServico as S } from './state-machine/status-ordem-servico.enum';

describe('OrdemServicoController', () => {
  let controller: OrdemServicoController;
  let service: jest.Mocked<OrdemServicoService>;

  beforeEach(() => {
    service = {
      criar: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findHistorico: jest.fn(),
      iniciarDiagnostico: jest.fn(),
      gerarOrcamento: jest.fn(),
      aprovarOrcamento: jest.fn(),
      reprovarOrcamento: jest.fn(),
      iniciarExecucao: jest.fn(),
      finalizar: jest.fn(),
      entregar: jest.fn(),
      cancelar: jest.fn(),
      avancarStatus: jest.fn(),
    } as unknown as jest.Mocked<OrdemServicoService>;
    controller = new OrdemServicoController(service);
  });

  it('POST /ordens delega ao service.criar', async () => {
    service.criar.mockResolvedValue({ id: 'os-1' } as never);
    const dto = {
      documentoCliente: '12345678901',
      veiculoId: 'vei',
      itensServico: [],
      itensPeca: [{ estoqueId: 1, quantidade: 1 }],
    };
    const result = await controller.criar(dto);
    expect(service.criar).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'os-1' });
  });

  it('GET /ordens delega filtros para findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: {} as never });
    await controller.listar({ page: 1, take: 10 });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /ordens/:id delega para findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'os-1' } as never);
    await controller.detalhar('os-1');
    expect(service.findOne).toHaveBeenCalledWith('os-1');
  });

  it('GET /ordens/:id/historico delega para findHistorico', async () => {
    service.findHistorico.mockResolvedValue([]);
    await controller.historico('os-1');
    expect(service.findHistorico).toHaveBeenCalledWith('os-1');
  });

  it.each([
    ['iniciarDiagnostico'] as const,
    ['gerarOrcamento'] as const,
    ['aprovarOrcamento'] as const,
    ['reprovarOrcamento'] as const,
    ['iniciarExecucao'] as const,
    ['finalizar'] as const,
    ['entregar'] as const,
    ['cancelar'] as const,
  ])('endpoint %s delega ao service', async (method) => {
    (service[method] as jest.Mock).mockResolvedValue({});
    await (
      controller as unknown as Record<string, (id: string) => Promise<unknown>>
    )[method]('os-1');
    expect(service[method]).toHaveBeenCalledWith('os-1');
  });

  it('POST avancar-status delega novoStatus', async () => {
    service.avancarStatus.mockResolvedValue({} as never);
    await controller.avancar('os-1', { novoStatus: S.Entregue });
    expect(service.avancarStatus).toHaveBeenCalledWith('os-1', S.Entregue);
  });
});
