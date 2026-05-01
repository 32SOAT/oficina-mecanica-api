import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('servico')
export class ServicoEntity {
  @ApiProperty({ description: 'ID único do serviço' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nome do serviço',
    example: 'Troca de óleo',
  })
  @Column()
  servico: string;

  @ApiProperty({
    description: 'Descrição detalhada do serviço',
    example: 'Troca de óleo e filtro do motor',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @ApiProperty({
    description: 'Preço da mão de obra',
    example: 150.5,
  })
  @Column({
    name: 'preco_mao_de_obra',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precoMaoDeObra: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-10-01T12:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2023-10-01T12:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @ApiProperty({ description: 'Data de exclusão (soft delete)', example: null })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
