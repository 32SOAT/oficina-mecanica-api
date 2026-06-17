export type ClienteResumoOutput = {
  id: string;
  documento: string;
  nome: string;
  email: string;
  celularNumero: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type VeiculoOutput = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cliente_id: string;
  cliente?: ClienteResumoOutput;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
