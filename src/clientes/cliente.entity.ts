import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cliente')
@Index('IDX_cliente_documento', ['documento'], { unique: true })
export class ClienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documento: string;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column({ name: 'celular_numero' })
  celularNumero: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
