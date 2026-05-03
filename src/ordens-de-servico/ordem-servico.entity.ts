import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ClienteEntity } from '../clientes/cliente.entity';
import { VeiculoEntity } from '../veiculos/veiculo.entity';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';
import { HistoricoStatusOsEntity } from './entities/historico-status-os.entity';
import { StatusOrdemServico } from './state-machine/status-ordem-servico.enum';
import { ehTransicaoValida } from './state-machine/transicoes';
import { TransicaoInvalidaException } from './state-machine/transicao-invalida.exception';

@Entity('ordem_servico')
@Index('IDX_ordem_servico_veiculo_id_app', ['veiculo_id'])
@Index('IDX_ordem_servico_cliente_id_app', ['cliente_id'])
export class OrdemServicoEntity {
  @ApiProperty({ description: 'ID único da OS' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID do veículo associado' })
  @Column({ name: 'veiculo_id' })
  veiculo_id: string;

  @ApiProperty({ description: 'Veículo associado', type: () => VeiculoEntity })
  @ManyToOne(() => VeiculoEntity)
  @JoinColumn({ name: 'veiculo_id' })
  veiculo: VeiculoEntity;

  @ApiProperty({ description: 'ID do cliente associado' })
  @Column({ name: 'cliente_id' })
  cliente_id: string;

  @ApiProperty({ description: 'Cliente associado', type: () => ClienteEntity })
  @ManyToOne(() => ClienteEntity)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteEntity;

  @ApiProperty({ description: 'Valor total do orçamento' })
  @Column({ name: 'valor_total', type: 'numeric', precision: 10, scale: 2 })
  valorTotal: number;

  @ApiProperty({ description: 'Observações sobre a OS', nullable: true })
  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @ApiProperty({ description: 'Status atual da OS', enum: StatusOrdemServico })
  @Column({ name: 'status_atual', type: 'varchar' })
  status: StatusOrdemServico;

  @ApiProperty({
    description: 'Itens de serviço (mão de obra)',
    type: () => [ItemOsServicoEntity],
  })
  @OneToMany(() => ItemOsServicoEntity, (item) => item.os, { cascade: true })
  itensServico: ItemOsServicoEntity[];

  @ApiProperty({
    description: 'Itens de peças/insumos',
    type: () => [ItemOsEstoqueEntity],
  })
  @OneToMany(() => ItemOsEstoqueEntity, (item) => item.os, { cascade: true })
  itensPeca: ItemOsEstoqueEntity[];

  @ApiProperty({
    description: 'Histórico de transições de status',
    type: () => [HistoricoStatusOsEntity],
  })
  @OneToMany(() => HistoricoStatusOsEntity, (h) => h.os)
  historico: HistoricoStatusOsEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;

  avancarStatus(novo: StatusOrdemServico): {
    anterior: StatusOrdemServico;
    novo: StatusOrdemServico;
  } {
    if (!ehTransicaoValida(this.status, novo)) {
      throw new TransicaoInvalidaException(this.status, novo);
    }
    const anterior = this.status;
    this.status = novo;
    return { anterior, novo };
  }

  calcularValorTotal(): number {
    const totalServicos = (this.itensServico ?? []).reduce(
      (acc, i) => acc + Number(i.precoAplicado),
      0,
    );
    const totalPecas = (this.itensPeca ?? []).reduce(
      (acc, i) => acc + Number(i.precoAplicado) * i.quantidade,
      0,
    );
    return Number((totalServicos + totalPecas).toFixed(2));
  }

  todasPecasDisponiveis(): boolean {
    return (this.itensPeca ?? []).every((p) => p.disponivelNoDiagnostico);
  }
}
