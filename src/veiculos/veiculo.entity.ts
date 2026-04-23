import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ClienteEntity } from '../clientes/cliente.entity';

@Entity('veiculo')
@Index('IDX_veiculo_placa', ['placa'], { unique: true })
@Index('IDX_veiculo_cliente_id', ['cliente_id'])
export class VeiculoEntity {
  @ApiProperty({ description: 'ID único do veículo', example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Placa do veículo', example: 'ABC1234' })
  @Column()
  placa: string;

  @ApiProperty({ description: 'Marca do veículo', example: 'Toyota' })
  @Column()
  marca: string;

  @ApiProperty({ description: 'Modelo do veículo', example: 'Corolla' })
  @Column()
  modelo: string;

  @ApiProperty({ description: 'Ano do veículo', example: 2020 })
  @Column()
  ano: number;

  @ApiProperty({ description: 'ID do cliente proprietário', example: 'uuid-string' })
  @Column({ name: 'cliente_id' })
  cliente_id: string;

  @ApiProperty({ description: 'Cliente proprietário' })
  @ManyToOne(() => ClienteEntity, { eager: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteEntity;

  @ApiProperty({ description: 'Data de criação', example: '2023-10-01T12:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização', example: '2023-10-01T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @ApiProperty({ description: 'Data de exclusão (soft delete)', example: null })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}