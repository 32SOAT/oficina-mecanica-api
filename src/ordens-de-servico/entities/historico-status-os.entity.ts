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
import { ApiProperty } from '@nestjs/swagger';
import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';
import { OrdemServicoEntity } from '../ordem-servico.entity';

@Entity('historico_status_os')
export class HistoricoStatusOsEntity {
  @ApiProperty({ description: 'ID único da entrada do histórico' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID da OS' })
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoEntity, (os) => os.historico)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoEntity;

  @ApiProperty({
    description: 'Status anterior (null na criação)',
    enum: StatusOrdemServico,
    nullable: true,
  })
  @Column({ name: 'status_anterior', type: 'varchar', nullable: true })
  statusAnterior: StatusOrdemServico | null;

  @ApiProperty({ description: 'Novo status', enum: StatusOrdemServico })
  @Column({ name: 'status_novo', type: 'varchar' })
  statusNovo: StatusOrdemServico;

  @ApiProperty({
    description: 'ID do usuário que disparou a transição',
    nullable: true,
  })
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
