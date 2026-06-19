import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Estoque } from '../../../domain/estoque';

@Entity('estoque')
@Index('IDX_estoque_codigo', ['codigo'], { unique: true })
export class EstoqueTypeormEntity {
  @ApiProperty({ description: 'ID único do item de estoque', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Código único do item de estoque',
    example: 'PCA-001',
  })
  @Column()
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

  toDomain(): Estoque {
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica,
      quantidadeReservada: this.quantidadeReservada,
      precoUnitario: Number(this.precoUnitario),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }

  applyFromDomain(estoque: Estoque): void {
    this.codigo = estoque.codigo;
    this.pecasInsumos = estoque.pecasInsumos;
    this.quantidadeFisica = estoque.quantidadeFisica;
    this.quantidadeReservada = estoque.quantidadeReservada;
    this.precoUnitario = estoque.precoUnitario;
    this.updatedAt = estoque.updatedAt;
  }

  static fromDomain(estoque: Estoque): EstoqueTypeormEntity {
    const entity = new EstoqueTypeormEntity();

    if (estoque.id) {
      entity.id = estoque.id;
    }

    entity.codigo = estoque.codigo;
    entity.pecasInsumos = estoque.pecasInsumos;
    entity.quantidadeFisica = estoque.quantidadeFisica;
    entity.quantidadeReservada = estoque.quantidadeReservada;
    entity.precoUnitario = estoque.precoUnitario;
    entity.createdAt = estoque.createdAt;
    entity.updatedAt = estoque.updatedAt;
    entity.deletedAt = estoque.deletedAt;
    return entity;
  }

  reservar(quantidade: number): void {
    this.runDomainMutation((domain) => domain.reservar(quantidade));
  }

  reservarComprometidoParaOrdemServico(quantidade: number): void {
    this.runDomainMutation((domain) =>
      domain.reservarComprometidoParaOrdemServico(quantidade),
    );
  }

  darBaixa(quantidade: number): void {
    this.runDomainMutation((domain) => domain.darBaixa(quantidade));
  }

  darBaixaSomenteDisponivel(quantidade: number): void {
    this.runDomainMutation((domain) =>
      domain.darBaixaSomenteDisponivel(quantidade),
    );
  }

  private runDomainMutation(
    mutate: (domain: Estoque) => Estoque,
  ): void {
    try {
      const updated = mutate(this.toDomain());
      this.applyFromDomain(updated);
    } catch (error) {
      throw error;
    }
  }
}

/** @deprecated Use EstoqueTypeormEntity */
export { EstoqueTypeormEntity as EstoqueEntity };
