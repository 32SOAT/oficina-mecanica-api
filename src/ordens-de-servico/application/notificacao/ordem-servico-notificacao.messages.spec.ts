import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import {
  buildAdministradorPecasEmFaltaMessage,
  buildMecanicosStatusMessage,
  buildOrcamentoAguardandoAprovacaoMessage,
  buildServicoFinalizadoMessage,
  buildServicoReprovadoMessage,
} from './ordem-servico-notificacao.messages';

describe('ordem-servico-notificacao.messages', () => {
  it('monta e-mail de orçamento aguardando aprovação', () => {
    const message = buildOrcamentoAguardandoAprovacaoMessage({
      osId: 'os-1',
      placa: 'ABC1D23',
      valorTotal: 850,
      clienteNome: 'João',
    });

    expect(message.subject).toContain('os-1');
    expect(message.text).toContain('850.00');
    expect(message.html).toContain('ABC1D23');
  });

  it('monta e-mail para mecânicos', () => {
    const message = buildMecanicosStatusMessage({
      osId: 'os-1',
      placa: 'XYZ9A99',
      status: StatusOrdemServico.Recebida,
    });

    expect(message.subject).toContain('RECEBIDA');
    expect(message.html).toContain('XYZ9A99');
  });

  it('monta e-mail para administrador', () => {
    const message = buildAdministradorPecasEmFaltaMessage({
      osId: 'os-1',
      placa: 'HIJ7K89',
    });

    expect(message.text).toContain('encomenda');
  });

  it('monta e-mail de serviço finalizado', () => {
    const message = buildServicoFinalizadoMessage({
      osId: 'os-1',
      placa: 'LMN3O45',
      clienteNome: 'Maria',
    });

    expect(message.text).toContain('finalizado');
    expect(message.html).toContain('Maria');
  });

  it('monta e-mail de orçamento reprovado', () => {
    const message = buildServicoReprovadoMessage({
      osId: 'os-1',
      placa: 'QRS1T23',
      clienteNome: 'Carlos',
    });

    expect(message.text).toContain('recusado');
  });
});
