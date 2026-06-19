import { BadRequestError } from '../../../common/application/errors/application.errors';
import { Cnpj } from '../../../clientes/domain/value-objects/cnpj';
import { Cpf } from '../../../clientes/domain/value-objects/cpf';
import { Placa } from '../../../veiculos/domain/value-objects/placa';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export function assertOrdemServicoPossuiItens(
  itensServico?: Array<unknown>,
  itensPeca?: Array<unknown>,
): void {
  const totalItens = (itensServico?.length ?? 0) + (itensPeca?.length ?? 0);
  if (totalItens === 0) {
    throw new BadRequestError(
      'A OS precisa de ao menos um serviço ou uma peça.',
    );
  }
}

export function assertDocumentoClienteValido(documentoCliente: string): void {
  const documento = Cpf.normalize(documentoCliente);
  if (!Cpf.isValid(documento) && !Cnpj.isValid(documento)) {
    throw new BadRequestError('CPF/CNPJ inválido.');
  }
}

export function assertPlacaValida(placa: string): void {
  const normalized = Placa.normalize(placa);
  if (!Placa.isValid(normalized)) {
    throw new BadRequestError('Placa inválida.');
  }
}

export function assertOsEmDiagnostico(status: StatusOrdemServico): void {
  if (status !== StatusOrdemServico.EmDiagnostico) {
    throw new BadRequestError(
      'Só é possível alterar os itens enquanto a OS está em diagnóstico.',
    );
  }
}
