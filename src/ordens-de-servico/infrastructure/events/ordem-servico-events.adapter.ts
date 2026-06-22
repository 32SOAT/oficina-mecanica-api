import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoEventsPort } from '../../application/ports/ordem-servico-events.port';
import {
  OrcamentoAprovadoEvent,
  OrcamentoAprovadoEventName,
  OrcamentoGeradoEvent,
  OrcamentoGeradoEventName,
  OrcamentoReprovadoEvent,
  OrcamentoReprovadoEventName,
  OsCriadaEvent,
  OsCriadaEventName,
  OsEmExecucaoEvent,
  OsEmExecucaoEventName,
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from './ordem-servico.events';

@Injectable()
export class OrdemServicoEventsAdapter implements OrdemServicoEventsPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitStatusAlterado(
    osId: string,
    statusAnterior: StatusOrdemServico | null,
    statusNovo: StatusOrdemServico,
    usuarioId: string | null,
  ): void {
    this.eventEmitter.emit(
      StatusAlteradoEventName,
      new StatusAlteradoEvent(osId, statusAnterior, statusNovo, usuarioId),
    );
  }

  emitOsCriada(osId: string): void {
    this.eventEmitter.emit(OsCriadaEventName, new OsCriadaEvent(osId));
  }

  emitOrcamentoGerado(osId: string): void {
    this.eventEmitter.emit(
      OrcamentoGeradoEventName,
      new OrcamentoGeradoEvent(osId),
    );
  }

  emitOrcamentoAprovado(osId: string): void {
    this.eventEmitter.emit(
      OrcamentoAprovadoEventName,
      new OrcamentoAprovadoEvent(osId),
    );
  }

  emitOrcamentoReprovado(osId: string): void {
    this.eventEmitter.emit(
      OrcamentoReprovadoEventName,
      new OrcamentoReprovadoEvent(osId),
    );
  }

  emitOsEmExecucao(osId: string): void {
    this.eventEmitter.emit(OsEmExecucaoEventName, new OsEmExecucaoEvent(osId));
  }
}
