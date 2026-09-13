import tracer from 'dd-trace';
import { OrdemServicoMetricsAdapter } from './ordem-servico-metrics.adapter';

jest.mock('dd-trace', () => ({
  __esModule: true,
  default: { dogstatsd: { increment: jest.fn() } },
}));

describe('OrdemServicoMetricsAdapter', () => {
  it('emits one counter with only the fixed status tag; env/service are inherited from the SDK', () => {
    const increment = jest.spyOn(tracer.dogstatsd, 'increment');
    new OrdemServicoMetricsAdapter().registrarCriacao();
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenCalledWith('oficina.ordem_servico.criada', 1, {
      status_inicial: 'recebida',
    });
  });
});
