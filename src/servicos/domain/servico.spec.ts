import { Servico } from './servico';
import { InvalidPrecoMaoDeObraError } from './errors/invalid-preco-mao-de-obra.error';

describe('Servico', () => {
  const base = {
    id: 1,
    nome: 'Troca de óleo',
    descricao: 'Completa',
    precoMaoDeObra: 150,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  it('creates servico', () => {
    const servico = Servico.create(base);
    expect(servico.nome).toBe('Troca de óleo');
  });

  it('rejects negative preco on create', () => {
    expect(() =>
      Servico.create({ ...base, precoMaoDeObra: -1 }),
    ).toThrow(InvalidPrecoMaoDeObraError);
  });

  it('updates servico', () => {
    const servico = Servico.create(base);
    const updated = servico.update({ descricao: 'Nova descrição' });
    expect(updated.descricao).toBe('Nova descrição');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      base.updatedAt.getTime(),
    );
  });

  it('soft removes servico', () => {
    const servico = Servico.create(base);
    const removed = servico.softRemove();
    expect(removed.deletedAt).toBeInstanceOf(Date);
  });

  it('throws when updating without id', () => {
    const servico = Servico.create({ nome: 'X', precoMaoDeObra: 10 });
    expect(() => servico.update({ nome: 'Y' })).toThrow(
      'Serviço sem ID não pode ser atualizado',
    );
  });
});
