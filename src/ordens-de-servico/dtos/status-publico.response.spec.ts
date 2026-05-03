import {
  StatusPublicoResponse,
  VeiculoPublico,
  LinhaTempoEntry,
} from './status-publico.response';
import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';

describe('StatusPublicoResponse types', () => {
  it('estrutura serializa corretamente', () => {
    const veiculo = new VeiculoPublico();
    veiculo.placa = 'ABC1D23';
    veiculo.modelo = 'Corolla';

    const linha = new LinhaTempoEntry();
    linha.status = StatusOrdemServico.Recebida;
    linha.em = new Date('2026-01-01T00:00:00Z');

    const resp = new StatusPublicoResponse();
    resp.id = 'os-1';
    resp.status = StatusOrdemServico.EmExecucao;
    resp.atualizadoEm = new Date('2026-01-02');
    resp.valorTotal = 100;
    resp.veiculo = veiculo;
    resp.linhaDoTempo = [linha];

    expect(resp.id).toBe('os-1');
    expect(resp.veiculo.placa).toBe('ABC1D23');
    expect(resp.linhaDoTempo[0].status).toBe(StatusOrdemServico.Recebida);
  });
});
