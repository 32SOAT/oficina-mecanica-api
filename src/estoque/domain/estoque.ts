import { EstoqueOperacaoInvalidaError } from './errors/estoque-operacao-invalida.error';

export type EstoqueProps = {
  id?: number;
  codigo: string;
  pecasInsumos: string;
  quantidadeFisica: number;
  quantidadeReservada: number;
  precoUnitario: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Estoque {
  readonly id?: number;
  readonly codigo: string;
  readonly pecasInsumos: string;
  readonly quantidadeFisica: number;
  readonly quantidadeReservada: number;
  readonly precoUnitario: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: EstoqueProps) {
    this.id = props.id;
    this.codigo = props.codigo;
    this.pecasInsumos = props.pecasInsumos;
    this.quantidadeFisica = props.quantidadeFisica;
    this.quantidadeReservada = props.quantidadeReservada;
    this.precoUnitario = props.precoUnitario;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }

  get quantidadeDisponivel(): number {
    return this.quantidadeFisica - this.quantidadeReservada;
  }

  static create(props: {
    codigo: string;
    pecasInsumos: string;
    quantidadeFisica: number;
    precoUnitario: number;
  }): Estoque {
    return new Estoque({
      codigo: props.codigo,
      pecasInsumos: props.pecasInsumos,
      quantidadeFisica: props.quantidadeFisica,
      quantidadeReservada: 0,
      precoUnitario: props.precoUnitario,
    });
  }

  atualizarCadastro(props: {
    codigo?: string;
    pecasInsumos?: string;
    precoUnitario?: number;
  }): Estoque {
    return new Estoque({
      id: this.id,
      codigo: props.codigo ?? this.codigo,
      pecasInsumos: props.pecasInsumos ?? this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica,
      quantidadeReservada: this.quantidadeReservada,
      precoUnitario: props.precoUnitario ?? this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  adicionarReposicao(quantidade: number): Estoque {
    this.assertQuantidadePositiva(quantidade);
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica + quantidade,
      quantidadeReservada: this.quantidadeReservada,
      precoUnitario: this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  reservar(quantidade: number): Estoque {
    this.assertQuantidadePositiva(quantidade);
    if (quantidade > this.quantidadeDisponivel) {
      throw new EstoqueOperacaoInvalidaError(
        `Estoque insuficiente. Disponível: ${this.quantidadeDisponivel}, solicitado: ${quantidade}.`,
      );
    }
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica,
      quantidadeReservada: this.quantidadeReservada + quantidade,
      precoUnitario: this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  reservarComprometidoParaOrdemServico(quantidade: number): Estoque {
    this.assertQuantidadePositiva(quantidade);
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica,
      quantidadeReservada: this.quantidadeReservada + quantidade,
      precoUnitario: this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  darBaixa(quantidade: number): Estoque {
    this.assertQuantidadePositiva(quantidade);
    if (quantidade > this.quantidadeFisica) {
      throw new EstoqueOperacaoInvalidaError(
        `Quantidade para baixa excede o estoque físico. Físico: ${this.quantidadeFisica}, solicitado: ${quantidade}.`,
      );
    }
    const novaReservada =
      this.quantidadeReservada >= quantidade
        ? this.quantidadeReservada - quantidade
        : this.quantidadeReservada;
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica - quantidade,
      quantidadeReservada: novaReservada,
      precoUnitario: this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  darBaixaSomenteDisponivel(quantidade: number): Estoque {
    this.assertQuantidadePositiva(quantidade);
    const disp = this.quantidadeDisponivel;
    if (quantidade > disp) {
      throw new EstoqueOperacaoInvalidaError(
        `Baixa excede o estoque disponível. Disponível: ${disp}, solicitado: ${quantidade}.`,
      );
    }
    return new Estoque({
      id: this.id,
      codigo: this.codigo,
      pecasInsumos: this.pecasInsumos,
      quantidadeFisica: this.quantidadeFisica - quantidade,
      quantidadeReservada: this.quantidadeReservada,
      precoUnitario: this.precoUnitario,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  assertRemovivel(): void {
    if (this.quantidadeFisica !== 0 || this.quantidadeReservada !== 0) {
      throw new EstoqueOperacaoInvalidaError(
        'Item só pode ser removido com quantidade física e reservada zeradas.',
      );
    }
  }

  private assertQuantidadePositiva(quantidade: number): void {
    if (quantidade <= 0) {
      throw new EstoqueOperacaoInvalidaError(
        'Quantidade deve ser maior que zero.',
      );
    }
  }
}
