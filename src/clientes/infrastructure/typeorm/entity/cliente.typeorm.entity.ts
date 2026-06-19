import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from '../../../domain/cliente';
import { ClienteDocumento } from '../../../domain/cliente-documento';

@Entity('cliente')
export class ClienteTypeormEntity {
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

  public static fromDomain(cliente: Cliente): ClienteTypeormEntity {
    const entity = new ClienteTypeormEntity();

    if (cliente.id) {
      entity.id = cliente.id;
    }

    entity.documento = cliente.documento.toString();
    entity.nome = cliente.nome;
    entity.email = cliente.email;
    entity.celularNumero = cliente.celularNumero;
    entity.createdAt = cliente.createdAt;
    entity.updatedAt = cliente.updatedAt;
    entity.deletedAt = cliente.deletedAt;
    return entity;
  }

  public toDomain(): Cliente {
    return Cliente.create({
      id: this.id,
      documento: ClienteDocumento.create(this.documento),
      nome: this.nome,
      email: this.email,
      celularNumero: this.celularNumero,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }
}

/** @deprecated Use ClienteTypeormEntity */
export { ClienteTypeormEntity as ClienteEntity };
