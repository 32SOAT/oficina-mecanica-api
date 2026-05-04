import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricoStatusOsEntity } from '../../entities/historico-status-os.entity';
import {
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from '../ordem-servico.events';

@Injectable()
export class PersistirHistoricoListener {
  constructor(
    @InjectRepository(HistoricoStatusOsEntity)
    private readonly historicoRepository: Repository<HistoricoStatusOsEntity>,
  ) {}

  @OnEvent(StatusAlteradoEventName)
  async handle(event: StatusAlteradoEvent): Promise<void> {
    const linha = this.historicoRepository.create({
      os_id: event.osId,
      statusAnterior: event.statusAnterior,
      statusNovo: event.statusNovo,
      usuarioId: event.usuarioId,
    });
    await this.historicoRepository.save(linha);
  }
}
