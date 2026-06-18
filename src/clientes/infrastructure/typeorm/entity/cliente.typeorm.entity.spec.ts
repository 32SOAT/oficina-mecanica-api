import { ClienteTypeormEntity } from './cliente.typeorm.entity';
import { Cliente } from '../../../domain/cliente';
import { ClienteDocumento } from '../../../domain/cliente-documento';

describe('ClienteTypeormEntity', () => {
  it('should convert domain to entity without id when creating', () => {
    const cliente = Cliente.create({
      documento: ClienteDocumento.create('28857786013'),
      nome: 'Novo',
      email: 'novo@email.com',
      celularNumero: '5511999999999',
    });

    const entity = ClienteTypeormEntity.fromDomain(cliente);

    expect(entity.id).toBeUndefined();
    expect(entity.documento).toBe('28857786013');
  });

  it('should convert domain to entity (fromDomain)', () => {
    const cliente = Cliente.create({
      id: '123',
      documento: ClienteDocumento.create('28857786013'),
      nome: 'Matheus',
      email: 'matheus@email.com',
      celularNumero: '5511999999999',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    });

    const entity = ClienteTypeormEntity.fromDomain(cliente);

    expect(entity).toBeInstanceOf(ClienteTypeormEntity);
    expect(entity.id).toBe('123');
    expect(entity.documento).toBe('28857786013');
    expect(entity.nome).toBe('Matheus');
    expect(entity.email).toBe('matheus@email.com');
    expect(entity.celularNumero).toBe('5511999999999');
  });

  it('should convert entity to domain (toDomain)', () => {
    const entity = new ClienteTypeormEntity();
    entity.id = '123';
    entity.documento = '28857786013';
    entity.nome = 'Matheus';
    entity.email = 'matheus@email.com';
    entity.celularNumero = '5511999999999';
    entity.createdAt = new Date('2024-01-01');
    entity.updatedAt = new Date('2024-01-02');
    entity.deletedAt = null;

    const cliente = entity.toDomain();

    expect(cliente.id).toBe('123');
    expect(cliente.documento.toString()).toBe('28857786013');
    expect(cliente.nome).toBe('Matheus');
    expect(cliente.email).toBe('matheus@email.com');
    expect(cliente.celularNumero).toBe('5511999999999');
  });
});
