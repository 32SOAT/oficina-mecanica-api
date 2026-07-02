export type VeiculoSnapshot = {
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

export const VEICULO_LOOKUP_PORT = 'VEICULO_LOOKUP_PORT';

export abstract class VeiculoLookupPort {
  abstract findSnapshotById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<VeiculoSnapshot | null>;
}
