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
import { ServicoTypeormEntity } from '../../../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { OrdemServicoTypeormEntity } from './ordem-servico.typeorm.entity';

@Entity('item_os_servico')
export class ItemOsServicoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoTypeormEntity, (os) => os.itensServico)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoTypeormEntity;
  @Column({ name: 'servico_id' })
  servico_id: number;
  @ManyToOne(() => ServicoTypeormEntity, { eager: true })
  @JoinColumn({ name: 'servico_id' })
  servico: ServicoTypeormEntity;
  @Column({ name: 'preco_aplicado', type: 'numeric', precision: 10, scale: 2 })
  precoAplicado: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
