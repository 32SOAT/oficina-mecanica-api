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
import { EstoqueEntity } from '../../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { OrdemServicoTypeormEntity } from './ordem-servico.typeorm.entity';

@Entity('item_os_estoque')
export class ItemOsEstoqueEntity {
  @ApiProperty({ description: 'ID único do item de estoque da OS' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID da OS' })
  @Column({ name: 'os_id' })
  os_id: string;

  @ManyToOne(() => OrdemServicoTypeormEntity, (os) => os.itensPeca)
  @JoinColumn({ name: 'os_id' })
  os: OrdemServicoTypeormEntity;

  @ApiProperty({ description: 'ID da peça/insumo no estoque' })
  @Column({ name: 'estoque_id' })
  estoque_id: number;

  @ApiProperty({
    description: 'Peça/insumo do estoque',
    type: () => EstoqueEntity,
  })
  @ManyToOne(() => EstoqueEntity, { eager: true })
  @JoinColumn({ name: 'estoque_id' })
  peca: EstoqueEntity;

  @ApiProperty({ description: 'Quantidade desta peça utilizada' })
  @Column({ type: 'integer' })
  quantidade: number;

  @ApiProperty({ description: 'Preço unitário aplicado (snapshot)' })
  @Column({ name: 'preco_aplicado', type: 'numeric', precision: 10, scale: 2 })
  precoAplicado: number;

  @ApiProperty({
    description:
      'Se a peça estava disponível em estoque no momento do diagnóstico',
  })
  @Column({ name: 'disponivel_no_diagnostico', default: false })
  disponivelNoDiagnostico: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
