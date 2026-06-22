import { TipoOperacaoEstoque } from './tipo-operacao-estoque';

export type OperacaoEstoqueInput = {
  operacao: TipoOperacaoEstoque;
  quantidade: number;
};
