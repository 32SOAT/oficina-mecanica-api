import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export type ClienteOsReadModel = {
  id: string;
  documento: string;
  nome: string;
  email: string;
  celularNumero: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type VeiculoOsReadModel = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cliente_id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type ServicoSnapshotReadModel = {
  id: number;
  servico: string;
  descricao?: string;
  precoMaoDeObra: number;
};

export type EstoqueSnapshotReadModel = {
  id: number;
  codigo: string;
  pecasInsumos: string;
  quantidadeFisica: number;
  quantidadeReservada: number;
  precoUnitario: number;
};

export type ItemServicoOsReadModel = {
  id: string;
  os_id: string;
  servico_id: number;
  precoAplicado: number;
  servico?: ServicoSnapshotReadModel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type ItemPecaOsReadModel = {
  id: string;
  os_id: string;
  estoque_id: number;
  quantidade: number;
  precoAplicado: number;
  disponivelNoDiagnostico: boolean;
  peca?: EstoqueSnapshotReadModel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type OrdemServicoReadModel = {
  id: string;
  veiculo_id: string;
  cliente_id: string;
  valorTotal: number;
  observacao: string | null;
  status: StatusOrdemServico;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  cliente?: ClienteOsReadModel;
  veiculo?: VeiculoOsReadModel;
  itensServico?: ItemServicoOsReadModel[];
  itensPeca?: ItemPecaOsReadModel[];
};

export type HistoricoStatusReadModel = {
  id: string;
  os_id: string;
  statusAnterior: StatusOrdemServico | null;
  statusNovo: StatusOrdemServico;
  usuarioId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
