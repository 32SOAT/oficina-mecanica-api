import { BadRequestException } from '@nestjs/common';
import { StatusOrdemServico } from './status-ordem-servico.enum';
import { TransicaoInvalidaException } from './transicao-invalida.exception';

describe('TransicaoInvalidaException', () => {
  it('é uma BadRequestException', () => {
    const ex = new TransicaoInvalidaException(
      StatusOrdemServico.Recebida,
      StatusOrdemServico.Entregue,
    );
    expect(ex).toBeInstanceOf(BadRequestException);
  });

  it('expõe os estados de e para como propriedades públicas', () => {
    const ex = new TransicaoInvalidaException(
      StatusOrdemServico.Recebida,
      StatusOrdemServico.Entregue,
    );
    expect(ex.de).toBe(StatusOrdemServico.Recebida);
    expect(ex.para).toBe(StatusOrdemServico.Entregue);
  });

  it('inclui ambos os estados na mensagem', () => {
    const ex = new TransicaoInvalidaException(
      StatusOrdemServico.AguardandoAprovacao,
      StatusOrdemServico.Entregue,
    );
    expect(ex.message).toContain('AGUARDANDO_APROVACAO');
    expect(ex.message).toContain('ENTREGUE');
  });

  it('renderiza "nenhum" quando o estado de origem é null', () => {
    const ex = new TransicaoInvalidaException(
      null,
      StatusOrdemServico.Recebida,
    );
    expect(ex.de).toBeNull();
    expect(ex.message).toContain('nenhum');
    expect(ex.message).toContain('RECEBIDA');
  });
});
