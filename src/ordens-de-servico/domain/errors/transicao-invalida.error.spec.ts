import { StatusOrdemServico } from '../status-ordem-servico.enum';
import { TransicaoInvalidaError } from './transicao-invalida.error';

describe('TransicaoInvalidaError', () => {
  it('expõe os estados de e para como propriedades públicas', () => {
    const ex = new TransicaoInvalidaError(
      StatusOrdemServico.Recebida,
      StatusOrdemServico.Entregue,
    );
    expect(ex.de).toBe(StatusOrdemServico.Recebida);
    expect(ex.para).toBe(StatusOrdemServico.Entregue);
  });

  it('inclui ambos os estados na mensagem', () => {
    const ex = new TransicaoInvalidaError(
      StatusOrdemServico.AguardandoAprovacao,
      StatusOrdemServico.Entregue,
    );
    expect(ex.message).toContain('AGUARDANDO_APROVACAO');
    expect(ex.message).toContain('ENTREGUE');
  });

  it('renderiza "nenhum" quando o estado de origem é null', () => {
    const ex = new TransicaoInvalidaError(null, StatusOrdemServico.Recebida);
    expect(ex.de).toBeNull();
    expect(ex.message).toContain('nenhum');
    expect(ex.message).toContain('RECEBIDA');
  });
});
