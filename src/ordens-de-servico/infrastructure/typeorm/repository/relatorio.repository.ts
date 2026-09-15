import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JanelaTempoInput } from '../../../application/dto/janela-tempo.input';
import { TempoMedioReadModel } from '../../../application/read-models/tempo-medio-read-model';
import {
  RelatorioRepository,
  MediaTempoFase,
} from '../../../application/ports/relatorio.repository';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { OrdemServicoTypeormEntity } from '../entity/ordem-servico.typeorm.entity';

@Injectable()
export class RelatorioTypeormRepository implements RelatorioRepository {
  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @InjectRepository(HistoricoStatusOsEntity)
    private readonly historicoRepository: Repository<HistoricoStatusOsEntity>,
  ) {}

  async tempoMedioFases(): Promise<MediaTempoFase[]> {
    // Read one snapshot, including entries before the 24h exit window.
    const agora = Date.now();
    const limite = agora - 24 * 60 * 60 * 1000;
    const historico = await this.historicoRepository.find({
      order: { createdAt: 'ASC' },
    });
    const porOs = new Map<string, HistoricoStatusOsEntity[]>();
    for (const h of historico) {
      const rows = porOs.get(h.os_id) ?? [];
      rows.push(h);
      porOs.set(h.os_id, rows);
    }
    const S = StatusOrdemServico;
    const fases = [
      ['diagnostico', S.EmDiagnostico, S.AguardandoAprovacao],
      ['execucao', S.EmExecucao, S.Finalizada],
      ['finalizacao', S.Finalizada, S.Entregue],
    ] as const;
    const medias: MediaTempoFase[] = [];
    for (const [fase, status, destino] of fases) {
      let soma = 0;
      let quantidade = 0;
      for (const rows of porOs.values()) {
        const entradas = rows.filter((h) => h.statusNovo === status);
        const saidas = rows.filter((h) => h.statusAnterior === status);
        // Current workflow has no re-entry: multiple candidates are ambiguous.
        if (entradas.length !== 1 || saidas.length !== 1) continue;
        const entrada = entradas[0];
        const saida = saidas[0];
        const inicio = entrada.createdAt.getTime();
        const fim = saida.createdAt.getTime();
        if (
          saida.statusNovo !== destino ||
          !Number.isFinite(inicio) ||
          !Number.isFinite(fim) ||
          fim < inicio ||
          fim < limite ||
          fim > agora
        )
          continue;
        // Another transition between the pair makes the interval unreliable.
        if (
          rows.some(
            (h) =>
              h !== entrada &&
              h !== saida &&
              h.createdAt.getTime() >= inicio &&
              h.createdAt.getTime() <= fim,
          )
        )
          continue;
        soma += (fim - inicio) / 1000;
        quantidade++;
      }
      if (quantidade > 0) medias.push({ fase, segundos: soma / quantidade });
    }
    return medias;
  }

  async tempoMedioServicos(
    janela?: JanelaTempoInput,
  ): Promise<TempoMedioReadModel> {
    const statusesFinalizados = [
      StatusOrdemServico.Finalizada,
      StatusOrdemServico.Entregue,
    ];

    const qb = this.osRepository
      .createQueryBuilder('os')
      .where('os.status IN (:...statuses)', {
        statuses: statusesFinalizados,
      });

    if (janela?.dataInicio || janela?.dataFim) {
      qb.innerJoin(
        'os.historico',
        'h',
        'h.statusNovo IN (:...statusesFinalizados)',
        { statusesFinalizados },
      );
      if (janela.dataInicio) {
        qb.andWhere('h.createdAt >= :dataInicio', {
          dataInicio: new Date(janela.dataInicio),
        });
      }
      if (janela.dataFim) {
        const fim = new Date(janela.dataFim);
        fim.setHours(23, 59, 59, 999);
        qb.andWhere('h.createdAt <= :dataFim', { dataFim: fim });
      }
      qb.distinct(true);
    }

    const oss = await qb.getMany();
    const osIds = oss.map((os) => os.id);

    const historicoPorOs = new Map<string, HistoricoStatusOsEntity[]>();
    if (osIds.length > 0) {
      const historico = await this.historicoRepository.find({
        where: { os_id: In(osIds) },
        order: { createdAt: 'ASC' },
      });
      for (const entry of historico) {
        const list = historicoPorOs.get(entry.os_id) ?? [];
        list.push(entry);
        historicoPorOs.set(entry.os_id, list);
      }
    }

    let soma = 0;
    let n = 0;
    for (const os of oss) {
      const historico = historicoPorOs.get(os.id) ?? [];
      const tempo = this.calcularTempoEmExecucao(historico);
      if (tempo > 0) {
        soma += tempo;
        n += 1;
      }
    }

    const tempoMedioMs = n === 0 ? 0 : soma / n;
    return {
      tempoMedioMs,
      tempoMedioFormatado: this.formatarMs(tempoMedioMs),
      totalOSConsideradas: n,
      janela: janela ?? null,
    };
  }

  private calcularTempoEmExecucao(
    historico: HistoricoStatusOsEntity[],
  ): number {
    let total = 0;
    let inicio: Date | null = null;
    for (const h of historico) {
      if (h.statusNovo === StatusOrdemServico.EmExecucao) {
        inicio = h.createdAt;
      } else if (inicio && h.statusAnterior === StatusOrdemServico.EmExecucao) {
        total += h.createdAt.getTime() - inicio.getTime();
        inicio = null;
      }
    }
    return total;
  }

  private formatarMs(ms: number): string {
    if (ms === 0) return '0';
    const segs = Math.round(ms / 1000);
    const h = Math.floor(segs / 3600);
    const m = Math.floor((segs % 3600) / 60);
    return `${h}h ${m}min`;
  }
}
