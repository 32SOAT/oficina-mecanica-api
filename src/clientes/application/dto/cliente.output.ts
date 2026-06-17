import { Cliente } from '../../domain/cliente';
import { PaginationMeta } from '../../../common/pagination/pagination';

export type ClienteOutput = {
  id: string;
  documento: string;
  nome: string;
  email: string;
  celularNumero: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type FindAllClientesOutput = {
  data: ClienteOutput[];
  meta: PaginationMeta | undefined;
};

export const ClienteOutputMapper = {
  fromDomain(cliente: Cliente): ClienteOutput {
    return {
      id: cliente.id!,
      documento: cliente.documento.toString(),
      nome: cliente.nome,
      email: cliente.email,
      celularNumero: cliente.celularNumero,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      deletedAt: cliente.deletedAt,
    };
  },
};
