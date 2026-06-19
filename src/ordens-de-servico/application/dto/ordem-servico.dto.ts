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

export type {
  ClienteOsReadModel,
  VeiculoOsReadModel,
  ServicoSnapshotReadModel,
  EstoqueSnapshotReadModel,
  ItemServicoOsReadModel,
  ItemPecaOsReadModel,
  OrdemServicoReadModel,
  HistoricoStatusReadModel,
  OrdemServicoOutput,
  HistoricoStatusOutput,
} from '../read-models/ordem-servico-read-model';
