import { HistoricoStatusOsEntity } from './historico-status-os.entity';
import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';

describe('HistoricoStatusOsEntity', () => {
  it('instancia com transição típica', () => {
    const h = new HistoricoStatusOsEntity();
    h.id = 'h-1';
    h.os_id = 'os-1';
    h.statusAnterior = StatusOrdemServico.Recebida;
    h.statusNovo = StatusOrdemServico.EmDiagnostico;
    h.usuarioId = 'user-1';
    expect(h.statusAnterior).toBe(StatusOrdemServico.Recebida);
    expect(h.statusNovo).toBe(StatusOrdemServico.EmDiagnostico);
  });

  it('aceita statusAnterior e usuarioId nulos', () => {
    const h = new HistoricoStatusOsEntity();
    h.statusAnterior = null;
    h.usuarioId = null;
    h.statusNovo = StatusOrdemServico.Recebida;
    expect(h.statusAnterior).toBeNull();
    expect(h.usuarioId).toBeNull();
  });
});
