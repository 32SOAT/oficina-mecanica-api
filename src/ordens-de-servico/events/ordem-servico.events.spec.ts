import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';
import {
  StatusAlteradoEvent,
  OsCriadaEvent,
  DiagnosticoIniciadoEvent,
  OrcamentoGeradoEvent,
  OrcamentoAprovadoEvent,
  OrcamentoReprovadoEvent,
  OsEmExecucaoEvent,
  OsFinalizadaEvent,
  OsEntregueEvent,
  OsCanceladaEvent,
  AguardandoPecasEvent,
  StatusAlteradoEventName,
  OsCriadaEventName,
  DiagnosticoIniciadoEventName,
  OrcamentoGeradoEventName,
  OrcamentoAprovadoEventName,
  OrcamentoReprovadoEventName,
  OsEmExecucaoEventName,
  OsFinalizadaEventName,
  OsEntregueEventName,
  OsCanceladaEventName,
  AguardandoPecasEventName,
} from './ordem-servico.events';

describe('Domain events', () => {
  it('expõe nomes de evento únicos e estáveis', () => {
    const nomes = [
      StatusAlteradoEventName,
      OsCriadaEventName,
      DiagnosticoIniciadoEventName,
      OrcamentoGeradoEventName,
      OrcamentoAprovadoEventName,
      OrcamentoReprovadoEventName,
      OsEmExecucaoEventName,
      OsFinalizadaEventName,
      OsEntregueEventName,
      OsCanceladaEventName,
      AguardandoPecasEventName,
    ];
    expect(new Set(nomes).size).toBe(nomes.length);
    nomes.forEach((n) => expect(n).toMatch(/^os\./));
  });

  it('StatusAlteradoEvent carrega os 5 campos esperados', () => {
    const e = new StatusAlteradoEvent(
      'os-1',
      StatusOrdemServico.Recebida,
      StatusOrdemServico.EmDiagnostico,
      'usuario-1',
    );
    expect(e.osId).toBe('os-1');
    expect(e.statusAnterior).toBe(StatusOrdemServico.Recebida);
    expect(e.statusNovo).toBe(StatusOrdemServico.EmDiagnostico);
    expect(e.usuarioId).toBe('usuario-1');
    expect(e.em).toBeInstanceOf(Date);
  });

  it.each([
    ['OsCriadaEvent', () => new OsCriadaEvent('os-1')],
    ['DiagnosticoIniciadoEvent', () => new DiagnosticoIniciadoEvent('os-1')],
    ['OrcamentoGeradoEvent', () => new OrcamentoGeradoEvent('os-1')],
    ['OrcamentoAprovadoEvent', () => new OrcamentoAprovadoEvent('os-1')],
    ['OrcamentoReprovadoEvent', () => new OrcamentoReprovadoEvent('os-1')],
    ['OsEmExecucaoEvent', () => new OsEmExecucaoEvent('os-1')],
    ['OsFinalizadaEvent', () => new OsFinalizadaEvent('os-1')],
    ['OsEntregueEvent', () => new OsEntregueEvent('os-1')],
    ['OsCanceladaEvent', () => new OsCanceladaEvent('os-1')],
    ['AguardandoPecasEvent', () => new AguardandoPecasEvent('os-1')],
  ])('%s instancia com osId', (_, factory) => {
    const e = factory();
    expect(e.osId).toBe('os-1');
  });
});
