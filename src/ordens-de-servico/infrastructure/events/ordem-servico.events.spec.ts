import {
  AguardandoPecasEvent,
  DiagnosticoIniciadoEvent,
  OrcamentoAprovadoEvent,
  OrcamentoGeradoEvent,
  OrcamentoReprovadoEvent,
  OsCanceladaEvent,
  OsCriadaEvent,
  OsEmExecucaoEvent,
  OsEntregueEvent,
  OsFinalizadaEvent,
  StatusAlteradoEvent,
} from './ordem-servico.events';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

describe('OrdemServico events', () => {
  it('creates status alterado event', () => {
    const event = new StatusAlteradoEvent(
      'os-id',
      StatusOrdemServico.Recebida,
      StatusOrdemServico.EmDiagnostico,
      'user-id',
    );
    expect(event.osId).toBe('os-id');
    expect(event.statusNovo).toBe(StatusOrdemServico.EmDiagnostico);
  });

  it('creates lifecycle events', () => {
    expect(new OsCriadaEvent('1').osId).toBe('1');
    expect(new DiagnosticoIniciadoEvent('1').osId).toBe('1');
    expect(new OrcamentoGeradoEvent('1').osId).toBe('1');
    expect(new OrcamentoAprovadoEvent('1').osId).toBe('1');
    expect(new OrcamentoReprovadoEvent('1').osId).toBe('1');
    expect(new OsEmExecucaoEvent('1').osId).toBe('1');
    expect(new OsFinalizadaEvent('1').osId).toBe('1');
    expect(new OsEntregueEvent('1').osId).toBe('1');
    expect(new OsCanceladaEvent('1').osId).toBe('1');
    expect(new AguardandoPecasEvent('1').osId).toBe('1');
  });
});
