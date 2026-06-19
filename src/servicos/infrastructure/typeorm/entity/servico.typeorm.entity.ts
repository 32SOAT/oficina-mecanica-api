import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Servico } from '../../../domain/servico';

@Entity('servico')
export class ServicoTypeormEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  servico: string;
  @Column({ type: 'text', nullable: true })
  descricao?: string;
  @Column({
    name: 'preco_mao_de_obra',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precoMaoDeObra: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;

  public static fromDomain(servico: Servico): ServicoTypeormEntity {
    const entity = new ServicoTypeormEntity();

    if (servico.id) {
      entity.id = servico.id;
    }

    entity.servico = servico.nome;
    entity.descricao = servico.descricao;
    entity.precoMaoDeObra = servico.precoMaoDeObra;
    entity.createdAt = servico.createdAt;
    entity.updatedAt = servico.updatedAt;
    entity.deletedAt = servico.deletedAt;
    return entity;
  }

  toDomain(): Servico {
    return Servico.create({
      id: this.id,
      nome: this.servico,
      descricao: this.descricao,
      precoMaoDeObra: Number(this.precoMaoDeObra),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }
}

/** @deprecated Use ServicoTypeormEntity */
export { ServicoTypeormEntity as ServicoEntity };
