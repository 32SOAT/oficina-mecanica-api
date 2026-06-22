import { ItemOsServicoEntity } from './item-os-servico.entity';

describe('ItemOsServicoEntity', () => {
  it('instancia com campos atribuíveis', () => {
    const item = new ItemOsServicoEntity();
    item.id = 'item-1';
    item.os_id = 'os-1';
    item.servico_id = 5;
    item.precoAplicado = 150.5;
    expect(item.id).toBe('item-1');
    expect(item.os_id).toBe('os-1');
    expect(item.servico_id).toBe(5);
    expect(item.precoAplicado).toBe(150.5);
  });
});
