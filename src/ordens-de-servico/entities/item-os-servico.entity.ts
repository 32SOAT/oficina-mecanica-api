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
import { ServicoEntity } from '../../servicos/servico.entity';
import { OrdemServicoEntity } from '../ordem-servico.entity';

@Entity('item_os_servico')
export class ItemOsServicoEntity {
  @ApiProperty({ description: 'ID único do item de serviço da OS' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID da OS' })
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoEntity, (os) => os.itensServico)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoEntity;

  @ApiProperty({ description: 'ID do serviço' })
  @Column({ name: 'servico_id' })
  servico_id: number;

  @ApiProperty({ description: 'Serviço associado', type: () => ServicoEntity })
  @ManyToOne(() => ServicoEntity, { eager: true })
  @JoinColumn({ name: 'servico_id' })
  servico: ServicoEntity;

  @ApiProperty({
    description: 'Preço aplicado (snapshot do momento da criação)',
  })
  @Column({ name: 'preco_aplicado', type: 'numeric', precision: 10, scale: 2 })
  precoAplicado: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
