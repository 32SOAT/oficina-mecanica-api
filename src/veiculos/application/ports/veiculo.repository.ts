import { Veiculo } from '../../domain/veiculo';
import { VeiculoOutput } from '../dto/veiculo.output';

export const VEICULO_REPOSITORY = 'VEICULO_REPOSITORY';

export abstract class VeiculoRepository {
  abstract save(veiculo: Veiculo): Promise<VeiculoOutput>;
  abstract findAll(
    skip: number,
    take: number,
  ): Promise<[VeiculoOutput[], number]>;
  abstract findByPlaca(placa: string): Promise<VeiculoOutput | null>;
  abstract findById(id: string): Promise<VeiculoOutput | null>;
  abstract existsByPlaca(placa: string): Promise<boolean>;
  abstract softRemove(veiculo: Veiculo): Promise<VeiculoOutput>;
}
