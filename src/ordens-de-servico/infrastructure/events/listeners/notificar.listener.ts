import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../../../../clientes/application/ports/cliente-lookup.port';
import {
  VEICULO_LOOKUP_PORT,
  VeiculoLookupPort,
} from '../../../../veiculos/application/ports/veiculo-lookup.port';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import { OrdemServicoTypeormEntity } from '../../typeorm/entity/ordem-servico.typeorm.entity';
import {
  StatusAlteradoEvent,
  StatusAlteradoEventName,
} from '../ordem-servico.events';

type ClienteContato = {
  nome: string;
  email: string;
};

@Injectable()
export class NotificarListener {
  private readonly logger = new Logger(NotificarListener.name);

  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @Inject(CLIENTE_LOOKUP_PORT)
    private readonly clienteLookup: ClienteLookupPort,
    @Inject(VEICULO_LOOKUP_PORT)
    private readonly veiculoLookup: VeiculoLookupPort,
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

  private async resolvePlaca(os: OrdemServicoTypeormEntity): Promise<string> {
    if (os.veiculo?.placa) {
      return os.veiculo.placa;
    }

    const snapshot = await this.veiculoLookup.findSnapshotById(os.veiculo_id, {
      includeDeleted: true,
    });

    return snapshot?.placa ?? 'placa indisponível';
  }

  private async resolveClienteContato(
    os: OrdemServicoTypeormEntity,
  ): Promise<ClienteContato> {
    if (os.cliente?.nome && os.cliente?.email) {
      return { nome: os.cliente.nome, email: os.cliente.email };
    }

    const snapshot = await this.clienteLookup.findSnapshotById(os.cliente_id, {
      includeDeleted: true,
    });

    return {
      nome: snapshot?.nome ?? 'Cliente',
      email: snapshot?.email ?? '—',
    };
  }

  private async notificarClienteAguardandoAprovacao(
    osId: string,
  ): Promise<void> {
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

    const placa = await this.resolvePlaca(os);
    const cliente = await this.resolveClienteContato(os);

    // MOCK: integração real (e-mail, WhatsApp, SMS) seria aqui.
    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Orçamento da OS ${os.id} ` +
        `(veículo ${placa}, valor R$ ${Number(os.valorTotal).toFixed(2)}) ` +
        `enviado a ${cliente.nome} <${cliente.email}> para aprovação.`,
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

    const placa = await this.resolvePlaca(os);

    // MOCK: canal dedicado aos mecânicos (app interno, push, etc.).
    this.logger.log(
      `[MOCK NOTIFICAÇÃO MECÂNICOS] OS ${os.id} no status ${status} ` +
        `(veículo ${placa}) — verificar e dar sequência ao atendimento.`,
    );
  }

  private async notificarAdministradorPecasEmFalta(
    osId: string,
  ): Promise<void> {
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

    const placa = await this.resolvePlaca(os);

    // MOCK: e-mail/workflow de compras para o administrador.
    this.logger.log(
      `[MOCK NOTIFICAÇÃO ADMINISTRADOR] OS ${os.id} (veículo ${placa}) ` +
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

    const placa = await this.resolvePlaca(os);
    const cliente = await this.resolveClienteContato(os);

    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Serviço da OS ${os.id} finalizado ` +
        `(veículo ${placa}). Informar ${cliente.nome} ` +
        `<${cliente.email}> que o veículo pode ser retirado.`,
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

    const placa = await this.resolvePlaca(os);
    const cliente = await this.resolveClienteContato(os);

    this.logger.log(
      `[MOCK NOTIFICAÇÃO CLIENTE] Orçamento da OS ${os.id} recusado ` +
        `(veículo ${placa}). Informar ${cliente.nome} ` +
        `<${cliente.email}> que o veículo pode ser retirado.`,
    );
  }
}
