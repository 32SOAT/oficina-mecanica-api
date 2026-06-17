import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export type CriarOrdemServicoInput = {
  documentoCliente: string;
  placa: string;
  observacao?: string;
  itensServico?: { servicoId: number }[];
  itensPeca?: { estoqueId: number; quantidade: number }[];
};

export type EditarItensOsInput = {
  itensServico?: { servicoId: number }[];
  itensPeca?: { estoqueId: number; quantidade: number }[];
};

export type FiltrosOrdemServicoInput = {
  page?: number;
  take?: number;
  status?: StatusOrdemServico;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type HistoricoStatusOutput = {
  id: string;
  os_id: string;
  statusAnterior: StatusOrdemServico | null;
  statusNovo: StatusOrdemServico;
  usuarioId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type OrdemServicoOutput = {
  id: string;
  veiculo_id: string;
  cliente_id: string;
  valorTotal: number;
  observacao: string | null;
  status: StatusOrdemServico;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  cliente?: Record<string, unknown>;
  veiculo?: Record<string, unknown>;
  itensServico?: Record<string, unknown>[];
  itensPeca?: Record<string, unknown>[];
};
