import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdemServicoEntity } from '../../ordem-servico.entity';
import { StatusOrdemServico } from '../../state-machine/status-ordem-servico.enum';
import {
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from '../ordem-servico.events';

@Injectable()
export class NotificarListener {
  private readonly logger = new Logger(NotificarListener.name);

  constructor(
    @InjectRepository(OrdemServicoEntity)
    private readonly osRepository: Repository<OrdemServicoEntity>,
  ) {}

  @OnEvent(StatusAlteradoEventName)
  async handle(event: StatusAlteradoEvent): Promise<void> {
    switch (event.statusNovo) {
      case StatusOrdemServico.AguardandoAprovacao:
        await this.notificarClienteAguardandoAprovacao(event.osId);
        break;
      case StatusOrdemServico.Recebida:
      case StatusOrdemServico.AguardandoServico:
        await this.notificarMecanicos(event.osId, event.statusNovo);
        break;
      case StatusOrdemServico.AguardandoPecasInsumos:
        await this.notificarAdministradorPecasEmFalta(event.osId);
        break;
      case StatusOrdemServico.Finalizada:
        await this.notificarClienteServicoFinalizado(event.osId);
        break;
      case StatusOrdemServico.Reprovada:
        await this.notificarClienteServicoReprovado(event.osId);
        break;
      default:
        break;
    }
  }

  private async notificarClienteAguardandoAprovacao(osId: string): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: osId },
      relations: ['cliente', 'veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${osId} não encontrada ao notificar cliente (aguardando aprovação).`,
      );
      return;
    }
    // MOCK: integração real (e-mail, WhatsApp, SMS) seria aqui.
    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Orçamento da OS ${os.id} ` +
        `(veículo ${os.veiculo.placa}, valor R$ ${Number(os.valorTotal).toFixed(2)}) ` +
        `enviado a ${os.cliente.nome} <${os.cliente.email}> para aprovação.`,
    );
  }

  private async notificarMecanicos(
    osId: string,
    status: StatusOrdemServico,
  ): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: osId },
      relations: ['veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${osId} não encontrada ao notificar equipe de mecânicos.`,
      );
      return;
    }
    // MOCK: canal dedicado aos mecânicos (app interno, push, etc.).
    this.logger.log(
      `[MOCK NOTIFICAÇÃO MECÂNICOS] OS ${os.id} no status ${status} ` +
        `(veículo ${os.veiculo.placa}) — verificar e dar sequência ao atendimento.`,
    );
  }

  private async notificarAdministradorPecasEmFalta(osId: string): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: osId },
      relations: ['veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${osId} não encontrada ao notificar administrador (peças em falta).`,
      );
      return;
    }
    // MOCK: e-mail/workflow de compras para o administrador.
    this.logger.log(
      `[MOCK NOTIFICAÇÃO ADMINISTRADOR] OS ${os.id} (veículo ${os.veiculo.placa}) ` +
        `em AGUARDANDO_PECAS_INSUMOS — há itens em falta; providenciar encomenda.`,
    );
  }

  private async notificarClienteServicoFinalizado(osId: string): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: osId },
      relations: ['cliente', 'veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${osId} não encontrada ao notificar cliente (serviço finalizado).`,
      );
      return;
    }
    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Serviço da OS ${os.id} finalizado ` +
        `(veículo ${os.veiculo.placa}). Informar ${os.cliente.nome} ` +
        `<${os.cliente.email}> que o veículo pode ser retirado.`,
    );
  }

  private async notificarClienteServicoReprovado(osId: string): Promise<void> {
    const os = await this.osRepository.findOne({
      where: { id: osId },
      relations: ['cliente', 'veiculo'],
    });
    if (!os) {
      this.logger.warn(
        `OS ${osId} não encontrada ao notificar cliente (serviço reprovado).`,
      );
      return;
    }
    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Orçamento da OS ${os.id} recusado ` +
        `(veículo ${os.veiculo.placa}). Informar ${os.cliente.nome} ` +
        `<${os.cliente.email}> que o veículo pode ser retirado.`,
    );
  }
}
