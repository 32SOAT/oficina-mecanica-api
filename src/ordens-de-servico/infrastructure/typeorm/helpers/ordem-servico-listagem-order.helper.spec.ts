import { buildPrioridadeStatusListagemCaseSql } from './ordem-servico-listagem-order.helper';

describe('buildPrioridadeStatusListagemCaseSql', () => {
  it('gera CASE SQL alinhado à prioridade do domínio', () => {
    const sql = buildPrioridadeStatusListagemCaseSql('os.status');
    expect(sql).toContain("WHEN 'EM_EXECUCAO' THEN 1");
    expect(sql).toContain("WHEN 'AGUARDANDO_SERVICO' THEN 2");
    expect(sql).toContain("WHEN 'AGUARDANDO_PECAS_INSUMOS' THEN 3");
    expect(sql).toContain("WHEN 'AGUARDANDO_APROVACAO' THEN 4");
    expect(sql).toContain("WHEN 'EM_DIAGNOSTICO' THEN 5");
    expect(sql).toContain("WHEN 'RECEBIDA' THEN 6");
    expect(sql).toContain('ELSE 99');
  });
});
