export type EstoqueOutput = {
  id: number;
  codigo: string;
  pecasInsumos: string;
  quantidadeFisica: number;
  quantidadeReservada: number;
  quantidadeDisponivel: number;
  precoUnitario: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
