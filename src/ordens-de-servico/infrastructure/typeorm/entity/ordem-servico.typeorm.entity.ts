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
import { ClienteTypeormEntity } from '../../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { VeiculoTypeormEntity } from '../../../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
import { ItemOsServicoEntity } from './item-os-servico.entity';
import { ItemOsEstoqueEntity } from './item-os-estoque.entity';
import { HistoricoStatusOsEntity } from './historico-status-os.entity';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';

@Entity('ordem_servico')
@Index('IDX_ordem_servico_veiculo_id_app', ['veiculo_id'])
@Index('IDX_ordem_servico_cliente_id_app', ['cliente_id'])
export class OrdemServicoTypeormEntity {
  @ApiProperty({ description: 'ID único da OS' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID do veículo associado' })
  @Column({ name: 'veiculo_id' })
  veiculo_id: string;

  @ApiProperty({ description: 'Veículo associado', type: () => VeiculoTypeormEntity })
  @ManyToOne(() => VeiculoTypeormEntity)
  @JoinColumn({ name: 'veiculo_id' })
  veiculo: VeiculoTypeormEntity;

  @ApiProperty({ description: 'ID do cliente associado' })
  @Column({ name: 'cliente_id' })
  cliente_id: string;

  @ApiProperty({ description: 'Cliente associado', type: () => ClienteTypeormEntity })
  @ManyToOne(() => ClienteTypeormEntity)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteTypeormEntity;

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
}

/** @deprecated Use OrdemServicoTypeormEntity */
export { OrdemServicoTypeormEntity as OrdemServicoEntity };
