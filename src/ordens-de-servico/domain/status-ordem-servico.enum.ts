export enum StatusOrdemServico {
  Recebida = 'RECEBIDA',
  EmDiagnostico = 'EM_DIAGNOSTICO',
  AguardandoAprovacao = 'AGUARDANDO_APROVACAO',
  Aprovada = 'APROVADA',
  AguardandoServico = 'AGUARDANDO_SERVICO',
  AguardandoPecasInsumos = 'AGUARDANDO_PECAS_INSUMOS',
  EmExecucao = 'EM_EXECUCAO',
  Finalizada = 'FINALIZADA',
  Entregue = 'ENTREGUE',
  Reprovada = 'REPROVADA',
  Cancelada = 'CANCELADA',
}

export const STATUS_TERMINAIS: ReadonlyArray<StatusOrdemServico> = [
  StatusOrdemServico.Entregue,
  StatusOrdemServico.Cancelada,
];
