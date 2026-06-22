import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Estoque } from '../../../domain/estoque';

@Entity('estoque')
@Index('IDX_estoque_codigo', ['codigo'], { unique: true })
export class EstoqueTypeormEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column({ name: 'pecas_insumos' })
  pecasInsumos: string;

  @Column({ name: 'quantidade_fisica', default: 0 })
  quantidadeFisica: number;

  @Column({ name: 'quantidade_reservada', default: 0 })
  quantidadeReservada: number;

  @Column({ name: 'preco_unitario', type: 'numeric', precision: 10, scale: 2 })
  precoUnitario: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

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
}

/** @deprecated Use EstoqueTypeormEntity */
export { EstoqueTypeormEntity as EstoqueEntity };
