import { BadRequestError } from '../../../common/application/errors/application.errors';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import {
  assertDocumentoClienteValido,
  assertOrdemServicoPossuiItens,
  assertOsEmDiagnostico,
  assertPlacaValida,
} from './ordem-servico.validators';

describe('ordem-servico.validators', () => {
  it('assertOrdemServicoPossuiItens rejects empty lists', () => {
    expect(() => assertOrdemServicoPossuiItens([], [])).toThrow(
      BadRequestError,
    );
  });

  it('assertDocumentoClienteValido rejects invalid document', () => {
    expect(() => assertDocumentoClienteValido('00000000000')).toThrow(
      BadRequestError,
    );
  });

  it('assertPlacaValida rejects invalid plate', () => {
    expect(() => assertPlacaValida('INVALID')).toThrow(BadRequestError);
  });

  it('assertOsEmDiagnostico rejects other statuses', () => {
    expect(() => assertOsEmDiagnostico(StatusOrdemServico.Recebida)).toThrow(
      BadRequestError,
    );
  });
});
