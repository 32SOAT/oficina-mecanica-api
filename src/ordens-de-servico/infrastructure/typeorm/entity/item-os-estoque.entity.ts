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
import { EstoqueEntity } from '../../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { OrdemServicoTypeormEntity } from './ordem-servico.typeorm.entity';

@Entity('item_os_estoque')
export class ItemOsEstoqueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoTypeormEntity, (os) => os.itensPeca)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoTypeormEntity;
  @Column({ name: 'estoque_id' })
  estoque_id: number;
  @ManyToOne(() => EstoqueEntity, { eager: true })
  @JoinColumn({ name: 'estoque_id' })
  peca: EstoqueEntity;
  @Column({ type: 'integer' })
  quantidade: number;
  @Column({ name: 'preco_aplicado', type: 'numeric', precision: 10, scale: 2 })
  precoAplicado: number;
  @Column({ name: 'disponivel_no_diagnostico', default: false })
  disponivelNoDiagnostico: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
