import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import type { OrdemServicoReadModel } from '../../application/read-models/ordem-servico-read-model';
import { StatusPublicoResponse } from './status-publico.response';

describe('StatusPublicoResponse.fromReadModel', () => {
  it('monta resposta pública sem expor dados sensíveis do cliente', () => {
    const os: OrdemServicoReadModel = {
      id: 'os-1',
      veiculo_id: 'vei-1',
      cliente_id: 'cli-1',
      valorTotal: 850,
      observacao: null,
      status: StatusOrdemServico.EmExecucao,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      deletedAt: null,
      veiculo: {
        id: 'vei-1',
        placa: 'ABC1D23',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        cliente_id: 'cli-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      },
    };

    const resp = StatusPublicoResponse.fromReadModel(os, [
      {
        id: 'h-1',
        os_id: 'os-1',
        statusAnterior: StatusOrdemServico.Recebida,
        statusNovo: StatusOrdemServico.EmExecucao,
        usuarioId: 'user-1',
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: null,
      },
    ]);

    expect(resp.veiculo.placa).toBe('ABC1D23');
    expect(resp.valorTotal).toBe(850);
    expect(resp.linhaDoTempo).toHaveLength(1);
    expect(resp).not.toHaveProperty('cliente');
  });
});
