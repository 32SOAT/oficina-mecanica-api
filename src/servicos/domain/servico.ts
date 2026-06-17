import { InvalidPrecoMaoDeObraError } from './errors/invalid-preco-mao-de-obra.error';

export type ServicoProps = {
  nome: string;
  descricao?: string;
  precoMaoDeObra: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Servico {
  public readonly id?: number;
  public readonly nome: string;
  public readonly descricao?: string;
  public readonly precoMaoDeObra: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  private constructor(id: number | undefined, props: ServicoProps) {
    Servico.validatePreco(props.precoMaoDeObra);
    this.id = id;
    this.nome = props.nome;
    this.descricao = props.descricao;
    this.precoMaoDeObra = props.precoMaoDeObra;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  public static create(
    props: ServicoProps & { id?: number },
  ): Servico {
    return new Servico(props.id, props);
  }

  public update(props: {
    nome?: string;
    descricao?: string;
    precoMaoDeObra?: number;
  }): Servico {
    if (!this.id) {
      throw new Error('Serviço sem ID não pode ser atualizado');
    }

    return new Servico(this.id, {
      nome: props.nome ?? this.nome,
      descricao: props.descricao ?? this.descricao,
      precoMaoDeObra: props.precoMaoDeObra ?? this.precoMaoDeObra,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  public softRemove(): Servico {
    if (!this.id) {
      throw new Error('Serviço sem ID não pode ser removido');
    }

    return new Servico(this.id, {
      nome: this.nome,
      descricao: this.descricao,
      precoMaoDeObra: this.precoMaoDeObra,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }

  private static validatePreco(preco: number): void {
    if (preco < 0) {
      throw new InvalidPrecoMaoDeObraError();
    }
  }
}
