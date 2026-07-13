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
import { ClienteTypeormEntity } from '../../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { Veiculo } from '../../../domain/veiculo';

@Entity('veiculo')
@Index('IDX_veiculo_placa', ['placa'], { unique: true })
@Index('IDX_veiculo_cliente_id', ['cliente_id'])
export class VeiculoTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  placa: string;
  @Column()
  marca: string;
  @Column()
  modelo: string;
  @Column()
  ano: number;
  @Column({ name: 'cliente_id' })
  cliente_id: string;
  @ManyToOne(() => ClienteTypeormEntity, { eager: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteTypeormEntity;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;

  public toDomain(): Veiculo {
    return Veiculo.create({
      id: this.id,
      placa: this.placa,
      marca: this.marca,
      modelo: this.modelo,
      ano: this.ano,
      clienteId: this.cliente_id,
      cliente: this.cliente
        ? {
            id: this.cliente.id,
            documento: this.cliente.documento,
            nome: this.cliente.nome,
            email: this.cliente.email,
            celularNumero: this.cliente.celularNumero,
            createdAt: this.cliente.createdAt,
            updatedAt: this.cliente.updatedAt,
            deletedAt: this.cliente.deletedAt,
          }
        : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }

  public static fromDomain(veiculo: Veiculo): VeiculoTypeormEntity {
    const entity = new VeiculoTypeormEntity();

    if (veiculo.id) {
      entity.id = veiculo.id;
    }

    entity.placa = veiculo.placa.toString();
    entity.marca = veiculo.marca;
    entity.modelo = veiculo.modelo;
    entity.ano = veiculo.ano;
    entity.cliente_id = veiculo.clienteId;
    entity.createdAt = veiculo.createdAt;
    entity.updatedAt = veiculo.updatedAt;
    entity.deletedAt = veiculo.deletedAt;
    return entity;
  }
}
