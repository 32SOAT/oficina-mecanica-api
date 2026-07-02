import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLIENTE_LOOKUP_PORT,
  ClienteLookupPort,
} from '../../../../clientes/application/ports/cliente-lookup.port';
import { ResendConfig } from '../../../../config/env/resend.config';
import {
  NOTIFICACAO_PORT,
  NotificacaoPort,
} from '../../../../notificacoes/application/ports/notificacao.port';
import { getResendErrorHint } from '../../../../notificacoes/infrastructure/resend/resend-email.helper';
import {
  VEICULO_LOOKUP_PORT,
  VeiculoLookupPort,
} from '../../../../veiculos/application/ports/veiculo-lookup.port';
import {
  buildAdministradorPecasEmFaltaMessage,
  buildMecanicosStatusMessage,
  buildOrcamentoAguardandoAprovacaoMessage,
  buildServicoFinalizadoMessage,
  buildServicoReprovadoMessage,
} from '../../../application/notificacao/ordem-servico-notificacao.messages';
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
  private readonly emailMecanicos: string;
  private readonly emailAdmin: string;

  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @Inject(CLIENTE_LOOKUP_PORT)
    private readonly clienteLookup: ClienteLookupPort,
    @Inject(VEICULO_LOOKUP_PORT)
    private readonly veiculoLookup: VeiculoLookupPort,
    @Inject(NOTIFICACAO_PORT)
    private readonly notificacaoPort: NotificacaoPort,
    configService: ConfigService,
  ) {
    const resend = configService.getOrThrow<ResendConfig>('resend');
    this.emailMecanicos = resend.emailMecanicos;
    this.emailAdmin = resend.emailAdmin;
  }

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
      email: snapshot?.email ?? '',
    };
  }

  private isEmailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async enviarEmailValido(
    to: string,
    message: { subject: string; text: string; html: string },
    contexto: string,
  ): Promise<void> {
    if (!this.isEmailValido(to)) {
      this.logger.warn(
        `E-mail inválido ou ausente (${to}) ao notificar ${contexto}.`,
      );
      return;
    }

    try {
      await this.notificacaoPort.enviarEmail({ to, ...message });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail (${contexto}) para ${to}.`,
        error instanceof Error ? error.stack : String(error),
      );
      const hint = getResendErrorHint(error);
      if (hint) {
        this.logger.error(hint);
      }
    }
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
    const message = buildOrcamentoAguardandoAprovacaoMessage({
      osId: os.id,
      placa,
      valorTotal: Number(os.valorTotal),
      clienteNome: cliente.nome,
    });

    await this.enviarEmailValido(
      cliente.email,
      message,
      'orçamento aguardando aprovação',
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
    const message = buildMecanicosStatusMessage({
      osId: os.id,
      placa,
      status,
    });

    await this.enviarEmailValido(
      this.emailMecanicos,
      message,
      `equipe de mecânicos (${status})`,
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
    const message = buildAdministradorPecasEmFaltaMessage({
      osId: os.id,
      placa,
    });

    await this.enviarEmailValido(
      this.emailAdmin,
      message,
      'administrador (peças em falta)',
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
    const message = buildServicoFinalizadoMessage({
      osId: os.id,
      placa,
      clienteNome: cliente.nome,
    });

    await this.enviarEmailValido(
      cliente.email,
      message,
      'serviço finalizado',
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
    const message = buildServicoReprovadoMessage({
      osId: os.id,
      placa,
      clienteNome: cliente.nome,
    });

    await this.enviarEmailValido(
      cliente.email,
      message,
      'orçamento reprovado',
    );
  }
}
