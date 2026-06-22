import { ClienteDocumento } from './cliente-documento';

export type ClienteProps = {
  documento: ClienteDocumento;
  nome: string;
  email: string;
  celularNumero: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Cliente {
  public readonly id?: string;

  public readonly documento: ClienteDocumento;
  public readonly nome: string;
  public readonly email: string;
  public readonly celularNumero: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  private constructor(id: string | undefined, props: ClienteProps) {
    this.id = id;

    this.documento = props.documento;
    this.nome = props.nome;
    this.email = props.email;
    this.celularNumero = props.celularNumero;

    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  public static create(
    props: Omit<ClienteProps, 'documento'> & {
      documento: string | ClienteDocumento;
      id?: string;
    },
  ): Cliente {
    const documento =
      props.documento instanceof ClienteDocumento
        ? props.documento
        : ClienteDocumento.create(props.documento);

    return new Cliente(props.id, {
      ...props,
      documento,
    });
  }

  public update(props: {
    nome?: string;
    email?: string;
    celularNumero?: string;
    documento?: string;
  }): Cliente {
    if (!this.id) {
      throw new Error('Cliente sem ID não pode ser atualizado');
    }

    const documento = props.documento
      ? ClienteDocumento.create(props.documento)
      : this.documento;

    return new Cliente(this.id, {
      documento,
      nome: props.nome ?? this.nome,
      email: props.email ?? this.email,
      celularNumero: props.celularNumero ?? this.celularNumero,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  public softRemove(): Cliente {
    if (!this.id) {
      throw new Error('Cliente sem ID não pode ser removido');
    }

    return new Cliente(this.id, {
      documento: this.documento,
      nome: this.nome,
      email: this.email,
      celularNumero: this.celularNumero,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }

  public toPrimitives() {
    return {
      id: this.id,
      documento: this.documento.toString(),
      nome: this.nome,
      email: this.email,
      celularNumero: this.celularNumero,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
