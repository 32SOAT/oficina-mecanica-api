import { EstoqueOutput } from '../dto/estoque.output';
import { Estoque } from '../../domain/estoque';

export class EstoqueOutputMapper {
  static toDomain(output: EstoqueOutput): Estoque {
    return new Estoque({
      id: output.id,
      codigo: output.codigo,
      pecasInsumos: output.pecasInsumos,
      quantidadeFisica: output.quantidadeFisica,
      quantidadeReservada: output.quantidadeReservada,
      precoUnitario: output.precoUnitario,
      createdAt: output.createdAt,
      updatedAt: output.updatedAt,
      deletedAt: output.deletedAt,
    });
  }
}
