import { Servico } from '../../domain/servico';

export type ServicoOutput = {
  id: number;
  servico: string;
  descricao?: string;
  precoMaoDeObra: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const ServicoOutputMapper = {
  fromDomain(servico: Servico): ServicoOutput {
    return {
      id: servico.id!,
      servico: servico.nome,
      descricao: servico.descricao,
      precoMaoDeObra: servico.precoMaoDeObra,
      createdAt: servico.createdAt,
      updatedAt: servico.updatedAt,
      deletedAt: servico.deletedAt,
    };
  },
};
