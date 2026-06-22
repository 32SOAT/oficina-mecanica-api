import { Veiculo } from '../../domain/veiculo';

export const VEICULO_REPOSITORY = 'VEICULO_REPOSITORY';

export abstract class VeiculoRepository {
  abstract save(veiculo: Veiculo): Promise<Veiculo>;
  abstract findAll(
    skip: number,
    take: number,
  ): Promise<[Veiculo[], number]>;
  abstract findByPlaca(placa: string): Promise<Veiculo | null>;
  abstract findById(id: string): Promise<Veiculo | null>;
  abstract existsByPlaca(placa: string): Promise<boolean>;
  abstract softRemove(veiculo: Veiculo): Promise<Veiculo>;
}
