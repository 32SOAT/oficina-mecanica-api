import { EventEmitter2 } from '@nestjs/event-emitter';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoEventsAdapter } from './ordem-servico-events.adapter';
import {
  OrcamentoAprovadoEventName,
  OrcamentoGeradoEventName,
  OrcamentoReprovadoEventName,
  OsCriadaEventName,
  OsEmExecucaoEventName,
  StatusAlteradoEventName,
} from './ordem-servico.events';

describe('OrdemServicoEventsAdapter', () => {
  const emitter = { emit: jest.fn() };
  const adapter = new OrdemServicoEventsAdapter(
    emitter as unknown as EventEmitter2,
  );

  beforeEach(() => jest.clearAllMocks());

  it('emits domain events', () => {
    adapter.emitStatusAlterado(
      'os-1',
      StatusOrdemServico.Recebida,
      StatusOrdemServico.EmDiagnostico,
      'user-1',
    );
    adapter.emitOsCriada('os-1');
    adapter.emitOrcamentoGerado('os-1');
    adapter.emitOrcamentoAprovado('os-1');
    adapter.emitOrcamentoReprovado('os-1');
    adapter.emitOsEmExecucao('os-1');

    expect(emitter.emit).toHaveBeenCalledWith(
      StatusAlteradoEventName,
      expect.objectContaining({ osId: 'os-1' }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(OsCriadaEventName, expect.anything());
    expect(emitter.emit).toHaveBeenCalledWith(
      OrcamentoGeradoEventName,
      expect.anything(),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      OrcamentoAprovadoEventName,
      expect.anything(),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      OrcamentoReprovadoEventName,
      expect.anything(),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      OsEmExecucaoEventName,
      expect.anything(),
    );
  });
});
