import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';

@Entity('cliente')
export class ClienteTypeormEntity {
  @ApiProperty({
    description: 'ID único do cliente',
    example: 'uuid-string',
    nullable: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string | null;

  @ApiProperty({
    description: 'Documento do cliente (CPF ou CNPJ)',
    example: '12345678901',
  })
  @Column()
  documento: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  @Column()
  nome: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
  })
  @Column()
  email: string;

  @ApiProperty({ description: 'Número do celular', example: '+5511999999999' })
  @Column({ name: 'celular_numero' })
  celularNumero: string;

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

  public static fromDomain(cliente: Cliente): ClienteTypeormEntity {
    const entity = new ClienteTypeormEntity();
    entity.id = cliente.id;
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
