import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';

@Entity('estoque')
export class PecaEntity {
  @ApiProperty({ description: 'ID único da peça/insumo', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Código único da peça/insumo',
    example: 'PCA-001',
  })
  @Column({ unique: true })
  codigo: string;

  @ApiProperty({
    description: 'Nome da peça ou insumo',
    example: 'Pastilha de freio',
  })
  @Column({ name: 'pecas_insumos' })
  pecasInsumos: string;

  @ApiProperty({
    description: 'Quantidade física em estoque',
    example: 50,
  })
  @Column({ name: 'quantidade_fisica', default: 0 })
  quantidadeFisica: number;

  @ApiProperty({
    description: 'Quantidade reservada para ordens de serviço',
    example: 5,
  })
  @Column({ name: 'quantidade_reservada', default: 0 })
  quantidadeReservada: number;

  @ApiProperty({
    description: 'Preço unitário',
    example: 89.9,
  })
  @Column({ name: 'preco_unitario', type: 'numeric', precision: 10, scale: 2 })
  precoUnitario: number;

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

  get quantidadeDisponivel(): number {
    return this.quantidadeFisica - this.quantidadeReservada;
  }

  reservar(quantidade: number): void {
    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    if (quantidade > this.quantidadeDisponivel) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponível: ${this.quantidadeDisponivel}, solicitado: ${quantidade}.`,
      );
    }
    this.quantidadeReservada += quantidade;
  }

  darBaixa(quantidade: number): void {
    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    if (quantidade > this.quantidadeFisica) {
      throw new BadRequestException(
        `Quantidade para baixa excede o estoque físico. Físico: ${this.quantidadeFisica}, solicitado: ${quantidade}.`,
      );
    }
    this.quantidadeFisica -= quantidade;
    if (this.quantidadeReservada >= quantidade) {
      this.quantidadeReservada -= quantidade;
    }
  }
}
