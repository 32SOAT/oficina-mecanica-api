import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrdemServicoTypeormEntity } from '../entity/ordem-servico.typeorm.entity';
import { HistoricoStatusOsEntity } from '../entity/historico-status-os.entity';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';

export interface JanelaTempo {
  dataInicio?: string;
  dataFim?: string;
}

export interface TempoMedioResponse {
  tempoMedioMs: number;
  tempoMedioFormatado: string;
  totalOSConsideradas: number;
  janela: JanelaTempo | null;
}

@Injectable()
export class RelatorioTypeormRepository {
  constructor(
    @InjectRepository(OrdemServicoTypeormEntity)
    private readonly osRepository: Repository<OrdemServicoTypeormEntity>,
    @InjectRepository(HistoricoStatusOsEntity)
    private readonly historicoRepository: Repository<HistoricoStatusOsEntity>,
  ) {}

  async tempoMedioServicos(janela?: JanelaTempo): Promise<TempoMedioResponse> {
    const oss = await this.osRepository.find({
      where: {
        status: In([
          StatusOrdemServico.Finalizada,
          StatusOrdemServico.Entregue,
        ]),
      },
    });

    let soma = 0;
    let n = 0;
    for (const os of oss) {
      const historico = await this.historicoRepository.find({
        where: { os_id: os.id },
        order: { createdAt: 'ASC' },
      });
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

/** @deprecated Use RelatorioTypeormRepository */
export { RelatorioTypeormRepository as RelatorioService };
