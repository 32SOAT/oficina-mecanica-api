import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import { OrdemServicoTypeormEntity } from './ordem-servico.typeorm.entity';

@Entity('historico_status_os')
export class HistoricoStatusOsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoTypeormEntity, (os) => os.historico)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoTypeormEntity;
  @Column({ name: 'status_anterior', type: 'varchar', nullable: true })
  statusAnterior: StatusOrdemServico | null;
  @Column({ name: 'status_novo', type: 'varchar' })
  statusNovo: StatusOrdemServico;
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
