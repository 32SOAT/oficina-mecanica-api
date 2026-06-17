import { Injectable } from '@nestjs/common';
import { FindClienteByDocumentoUseCase } from '../../../clientes/application/use-cases/find-cliente-by-documento.use-case';
import { ClienteLookupPort } from '../../application/ports/cliente-lookup.port';

@Injectable()
export class ClienteLookupAdapter implements ClienteLookupPort {
  constructor(
    private readonly findClienteByDocumentoUseCase: FindClienteByDocumentoUseCase,
  ) {}

  async resolveClienteIdByDocumento(documento: string): Promise<string> {
    const cliente = await this.findClienteByDocumentoUseCase.execute(documento);
    return cliente.id!;
  }
}
