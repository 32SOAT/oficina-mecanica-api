import { Placa } from './value-objects/placa';

export type VeiculoProps = {
  placa: Placa;
  marca: string;
  modelo: string;
  ano: number;
  clienteId: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Veiculo {
  public readonly id?: string;
  public readonly placa: Placa;
  public readonly marca: string;
  public readonly modelo: string;
  public readonly ano: number;
  public readonly clienteId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  private constructor(id: string | undefined, props: VeiculoProps) {
    this.id = id;
    this.placa = props.placa;
    this.marca = props.marca;
    this.modelo = props.modelo;
    this.ano = props.ano;
    this.clienteId = props.clienteId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  public static create(
    props: Omit<VeiculoProps, 'placa'> & {
      placa: string | Placa;
      id?: string;
    },
  ): Veiculo {
    const placa =
      props.placa instanceof Placa ? props.placa : Placa.create(props.placa);

    return new Veiculo(props.id, { ...props, placa });
  }

  public update(props: {
    marca?: string;
    modelo?: string;
    ano?: number;
    clienteId?: string;
  }): Veiculo {
    if (!this.id) {
      throw new Error('Veículo sem ID não pode ser atualizado');
    }

    return new Veiculo(this.id, {
      placa: this.placa,
      marca: props.marca ?? this.marca,
      modelo: props.modelo ?? this.modelo,
      ano: props.ano ?? this.ano,
      clienteId: props.clienteId ?? this.clienteId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  public softRemove(): Veiculo {
    if (!this.id) {
      throw new Error('Veículo sem ID não pode ser removido');
    }

    return new Veiculo(this.id, {
      placa: this.placa,
      marca: this.marca,
      modelo: this.modelo,
      ano: this.ano,
      clienteId: this.clienteId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }
}
