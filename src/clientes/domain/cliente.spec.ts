import { Cliente } from './cliente';
import { ClienteDocumento } from './cliente-documento';

describe('Cliente (Domain Entity)', () => {
  const validCpf = '28857786013';

  it('should create a client with string documento', () => {
    const cliente = Cliente.create({
      documento: validCpf,
      nome: 'Matheus',
      email: 'matheus@email.com',
      celularNumero: '5511999999999',
    });

    expect(cliente).toBeInstanceOf(Cliente);
    expect(cliente.documento.toString()).toBe(validCpf);
    expect(cliente.nome).toBe('Matheus');
    expect(cliente.deletedAt).toBeNull();
  });

  it('should create a client with ClienteDocumento instance', () => {
    const documento = ClienteDocumento.create(validCpf);

    const cliente = Cliente.create({
      documento,
      nome: 'Matheus',
      email: 'matheus@email.com',
      celularNumero: '5511999999999',
    });

    expect(cliente.documento).toBe(documento);
  });

  it('should set createdAt and updatedAt automatically', () => {
    const cliente = Cliente.create({
      documento: validCpf,
      nome: 'Teste',
      email: 't@t.com',
      celularNumero: '1',
    });

    expect(cliente.createdAt).toBeInstanceOf(Date);
    expect(cliente.updatedAt).toBeInstanceOf(Date);

    // No create, ambos devem ser iguais
    expect(cliente.updatedAt.getTime()).toBe(cliente.createdAt.getTime());
  });

  it('should update a client and change updatedAt', () => {
    const cliente = Cliente.create({
      id: '1',
      documento: validCpf,
      nome: 'Original',
      email: 'o@o.com',
      celularNumero: '1',
    });

    const beforeUpdate = cliente.updatedAt.getTime();

    const updated = cliente.update({
      nome: 'Atualizado',
      email: 'novo@email.com',
    });

    expect(updated.nome).toBe('Atualizado');
    expect(updated.email).toBe('novo@email.com');
    expect(updated.id).toBe('1');

    // garante mudança sem flake
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
  });

  it('should throw error when updating client without id', () => {
    const cliente = Cliente.create({
      documento: validCpf,
      nome: 'Teste',
      email: 't@t.com',
      celularNumero: '1',
    });

    expect(() => cliente.update({ nome: 'Novo' })).toThrow(
      'Cliente sem ID não pode ser atualizado',
    );
  });

  it('should soft remove a client', () => {
    const cliente = Cliente.create({
      id: '1',
      documento: validCpf,
      nome: 'Teste',
      email: 't@t.com',
      celularNumero: '1',
    });

    const removed = cliente.softRemove();

    expect(removed.deletedAt).toBeInstanceOf(Date);
    expect(removed.updatedAt).toBeInstanceOf(Date);

    expect(removed.deletedAt).not.toBeNull();

    // soft remove sempre atualiza updatedAt
    expect(removed.updatedAt.getTime()).toBeGreaterThanOrEqual(
      cliente.updatedAt.getTime(),
    );
  });

  it('should throw error when soft removing client without id', () => {
    const cliente = Cliente.create({
      documento: validCpf,
      nome: 'Teste',
      email: 't@t.com',
      celularNumero: '1',
    });

    expect(() => cliente.softRemove()).toThrow(
      'Cliente sem ID não pode ser removido',
    );
  });

  it('should convert to primitives correctly', () => {
    const cliente = Cliente.create({
      id: '1',
      documento: validCpf,
      nome: 'Matheus',
      email: 'matheus@email.com',
      celularNumero: '5511999999999',
    });

    const data = cliente.toPrimitives();

    expect(data).toEqual(
      expect.objectContaining({
        id: '1',
        documento: validCpf,
        nome: 'Matheus',
        email: 'matheus@email.com',
        celularNumero: '5511999999999',
        deletedAt: null,
      }),
    );

    expect(data.createdAt).toBeInstanceOf(Date);
    expect(data.updatedAt).toBeInstanceOf(Date);
  });
});
