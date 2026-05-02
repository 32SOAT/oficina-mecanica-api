import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';

export const StatusAlteradoEventName = 'os.status.alterado';
export const OsCriadaEventName = 'os.criada';
export const DiagnosticoIniciadoEventName = 'os.diagnostico.iniciado';
export const OrcamentoGeradoEventName = 'os.orcamento.gerado';
export const OrcamentoAprovadoEventName = 'os.orcamento.aprovado';
export const OrcamentoReprovadoEventName = 'os.orcamento.reprovado';
export const OsEmExecucaoEventName = 'os.execucao.iniciada';
export const OsFinalizadaEventName = 'os.finalizada';
export const OsEntregueEventName = 'os.entregue';
export const OsCanceladaEventName = 'os.cancelada';
export const AguardandoPecasEventName = 'os.aguardando_pecas';

export class StatusAlteradoEvent {
  constructor(
    public readonly osId: string,
    public readonly statusAnterior: StatusOrdemServico | null,
    public readonly statusNovo: StatusOrdemServico,
    public readonly em: Date = new Date(),
  ) {}
}

export class OsCriadaEvent {
  constructor(public readonly osId: string) {}
}

export class OrcamentoAprovadoEvent {
  constructor(public readonly osId: string) {}
}

export class OrcamentoReprovadoEvent {
  constructor(public readonly osId: string) {}
}

export class OsEmExecucaoEvent {
  constructor(public readonly osId: string) {}
}

export class DiagnosticoIniciadoEvent {
  constructor(public readonly osId: string) {}
}

export class OrcamentoGeradoEvent {
  constructor(public readonly osId: string) {}
}

export class OsFinalizadaEvent {
  constructor(public readonly osId: string) {}
}

export class OsEntregueEvent {
  constructor(public readonly osId: string) {}
}

export class OsCanceladaEvent {
  constructor(public readonly osId: string) {}
}

export class AguardandoPecasEvent {
  constructor(public readonly osId: string) {}
}
