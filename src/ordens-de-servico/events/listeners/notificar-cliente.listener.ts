import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdemServicoEntity } from '../../ordem-servico.entity';
import {
  OrcamentoGeradoEvent,
  OrcamentoGeradoEventName,
} from '../ordem-servico.events';

@Injectable()
export class NotificarClienteListener {
  private readonly logger = new Logger(NotificarClienteListener.name);

  constructor(
    @InjectRepository(OrdemServicoEntity)
    private readonly osRepository: Repository<OrdemServicoEntity>,
  ) {}

  @OnEvent(OrcamentoGeradoEventName)
  async handle(event: OrcamentoGeradoEvent): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: event.osId },
      relations: ['cliente', 'veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${event.osId} não encontrada ao tentar notificar cliente.`,
      );
      return;
    }
    // MOCK: integração real (e-mail, WhatsApp, SMS) seria aqui.
    this.logger.log(
      `[MOCK NOTIFICAÇÃO] Orçamento da OS ${os.id} ` +
        `(veículo ${os.veiculo.placa}, valor R$ ${Number(os.valorTotal).toFixed(2)}) ` +
        `enviado a ${os.cliente.nome} <${os.cliente.email}> para aprovação.`,
    );
  }
}
