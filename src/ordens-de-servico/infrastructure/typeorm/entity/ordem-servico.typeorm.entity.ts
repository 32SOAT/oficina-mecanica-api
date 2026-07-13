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
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'veiculo_id' })
  veiculo_id: string;
  @ManyToOne(() => VeiculoTypeormEntity)
  @JoinColumn({ name: 'veiculo_id' })
  veiculo: VeiculoTypeormEntity;
  @Column({ name: 'cliente_id' })
  cliente_id: string;
  @ManyToOne(() => ClienteTypeormEntity)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteTypeormEntity;
  @Column({ name: 'valor_total', type: 'numeric', precision: 10, scale: 2 })
  valorTotal: number;
  @Column({ type: 'text', nullable: true })
  observacao: string | null;
  @Column({ name: 'status_atual', type: 'varchar' })
  status: StatusOrdemServico;
  @OneToMany(() => ItemOsServicoEntity, (item) => item.os, { cascade: true })
  itensServico: ItemOsServicoEntity[];
  @OneToMany(() => ItemOsEstoqueEntity, (item) => item.os, { cascade: true })
  itensPeca: ItemOsEstoqueEntity[];
  @OneToMany(() => HistoricoStatusOsEntity, (h) => h.os)
  historico: HistoricoStatusOsEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
