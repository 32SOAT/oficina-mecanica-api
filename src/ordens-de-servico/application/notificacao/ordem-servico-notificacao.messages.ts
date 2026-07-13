import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export type EmailMessage = {
  subject: string;
  text: string;
  html: string;
};

function paragraph(lines: string[]): string {
  return lines.map((line) => `<p>${line}</p>`).join('');
}

export function buildOrcamentoAguardandoAprovacaoMessage(params: {
  osId: string;
  placa: string;
  valorTotal: number;
  clienteNome: string;
}): EmailMessage {
  const valor = Number(params.valorTotal).toFixed(2);
  const text = [
    `Olá, ${params.clienteNome}.`,
    '',
    `O orçamento da ordem de serviço ${params.osId} (veículo ${params.placa})`,
    `no valor de R$ ${valor} está aguardando sua aprovação.`,
    '',
    'Entre em contato com a oficina para aprovar ou recusar o orçamento.',
    '',
    'Atenciosamente,',
    'Oficina Mecânica',
  ].join('\n');

  return {
    subject: `Orçamento aguardando aprovação — OS ${params.osId}`,
    text,
    html: paragraph([
      `Olá, ${params.clienteNome}.`,
      `O orçamento da ordem de serviço <strong>${params.osId}</strong> (veículo ${params.placa}) no valor de <strong>R$ ${valor}</strong> está aguardando sua aprovação.`,
      'Entre em contato com a oficina para aprovar ou recusar o orçamento.',
      'Atenciosamente,<br>Oficina Mecânica',
    ]),
  };
}

export function buildMecanicosStatusMessage(params: {
  osId: string;
  placa: string;
  status: StatusOrdemServico;
}): EmailMessage {
  const text = [
    'Equipe de mecânicos,',
    '',
    `A ordem de serviço ${params.osId} (veículo ${params.placa})`,
    `está no status ${params.status}.`,
    '',
    'Verifiquem e deem sequência ao atendimento.',
  ].join('\n');

  return {
    subject: `OS ${params.osId} — ${params.status}`,
    text,
    html: paragraph([
      'Equipe de mecânicos,',
      `A ordem de serviço <strong>${params.osId}</strong> (veículo ${params.placa}) está no status <strong>${params.status}</strong>.`,
      'Verifiquem e deem sequência ao atendimento.',
    ]),
  };
}

export function buildAdministradorPecasEmFaltaMessage(params: {
  osId: string;
  placa: string;
}): EmailMessage {
  const text = [
    'Administrador,',
    '',
    `A ordem de serviço ${params.osId} (veículo ${params.placa})`,
    'está em AGUARDANDO_PECAS_INSUMOS.',
    '',
    'Há itens em falta no estoque. Providencie a encomenda.',
  ].join('\n');

  return {
    subject: `Peças em falta — OS ${params.osId}`,
    text,
    html: paragraph([
      'Administrador,',
      `A ordem de serviço <strong>${params.osId}</strong> (veículo ${params.placa}) está em <strong>AGUARDANDO_PECAS_INSUMOS</strong>.`,
      'Há itens em falta no estoque. Providencie a encomenda.',
    ]),
  };
}

export function buildServicoFinalizadoMessage(params: {
  osId: string;
  placa: string;
  clienteNome: string;
}): EmailMessage {
  const text = [
    `Olá, ${params.clienteNome}.`,
    '',
    `O serviço da ordem ${params.osId} (veículo ${params.placa}) foi finalizado.`,
    'Seu veículo já pode ser retirado na oficina.',
    '',
    'Atenciosamente,',
    'Oficina Mecânica',
  ].join('\n');

  return {
    subject: `Serviço finalizado — OS ${params.osId}`,
    text,
    html: paragraph([
      `Olá, ${params.clienteNome}.`,
      `O serviço da ordem <strong>${params.osId}</strong> (veículo ${params.placa}) foi finalizado.`,
      'Seu veículo já pode ser retirado na oficina.',
      'Atenciosamente,<br>Oficina Mecânica',
    ]),
  };
}

export function buildServicoReprovadoMessage(params: {
  osId: string;
  placa: string;
  clienteNome: string;
}): EmailMessage {
  const text = [
    `Olá, ${params.clienteNome}.`,
    '',
    `O orçamento da ordem ${params.osId} (veículo ${params.placa}) foi recusado.`,
    'Seu veículo já pode ser retirado na oficina.',
    '',
    'Atenciosamente,',
    'Oficina Mecânica',
  ].join('\n');

  return {
    subject: `Orçamento recusado — OS ${params.osId}`,
    text,
    html: paragraph([
      `Olá, ${params.clienteNome}.`,
      `O orçamento da ordem <strong>${params.osId}</strong> (veículo ${params.placa}) foi recusado.`,
      'Seu veículo já pode ser retirado na oficina.',
      'Atenciosamente,<br>Oficina Mecânica',
    ]),
  };
}
