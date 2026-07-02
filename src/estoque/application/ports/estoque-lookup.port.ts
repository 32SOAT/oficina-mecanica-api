export type EstoqueSnapshot = {
  id: number;
  codigo: string;
  pecasInsumos: string;
  quantidadeFisica: number;
  quantidadeReservada: number;
  precoUnitario: number;
};

export const ESTOQUE_LOOKUP_PORT = 'ESTOQUE_LOOKUP_PORT';

export abstract class EstoqueLookupPort {
  abstract findSnapshotById(
    id: number,
    options?: { includeDeleted?: boolean },
  ): Promise<EstoqueSnapshot | null>;
}
