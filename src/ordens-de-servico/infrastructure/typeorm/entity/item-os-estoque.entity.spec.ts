import { ItemOsEstoqueEntity } from './item-os-estoque.entity';

describe('ItemOsEstoqueEntity', () => {
  it('instancia com todos os campos, incluindo disponivelNoDiagnostico', () => {
    const item = new ItemOsEstoqueEntity();
    item.id = 'item-1';
    item.os_id = 'os-1';
    item.estoque_id = 7;
    item.quantidade = 2;
    item.precoAplicado = 30.0;
    item.disponivelNoDiagnostico = true;
    expect(item.id).toBe('item-1');
    expect(item.estoque_id).toBe(7);
    expect(item.quantidade).toBe(2);
    expect(item.precoAplicado).toBe(30.0);
    expect(item.disponivelNoDiagnostico).toBe(true);
  });

  it('disponivelNoDiagnostico aceita false', () => {
    const item = new ItemOsEstoqueEntity();
    item.disponivelNoDiagnostico = false;
    expect(item.disponivelNoDiagnostico).toBe(false);
  });
});
