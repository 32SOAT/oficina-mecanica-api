import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { TransicaoInvalidaError } from '../../../ordens-de-servico/domain/errors/transicao-invalida.error';
import { StatusOrdemServico } from '../../../ordens-de-servico/domain/status-ordem-servico.enum';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../application/errors/application.errors';
import { ApplicationExceptionFilter } from './application-exception.filter';

describe('ApplicationExceptionFilter', () => {
  const filter = new ApplicationExceptionFilter();
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
  });

  it.each([
    [new NotFoundError('não encontrado'), HttpStatus.NOT_FOUND],
    [new BadRequestError('inválido'), HttpStatus.BAD_REQUEST],
    [new ConflictError('conflito'), HttpStatus.CONFLICT],
    [new UnauthorizedError('não autorizado'), HttpStatus.UNAUTHORIZED],
  ])('mapeia %s para HTTP %i', (error, expectedStatus) => {
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith({
      statusCode: expectedStatus,
      message: error.message,
    });
  });

  it('mapeia erro de domínio conhecido para 400', () => {
    const error = new TransicaoInvalidaError(
      StatusOrdemServico.Recebida,
      StatusOrdemServico.Entregue,
    );

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: error.message,
    });
  });

  it('repassa HttpException do Nest (ValidationPipe, guards)', () => {
    filter.catch(new HttpException('Campo inválido', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Campo inválido',
    });
  });

  it('repassa HttpException com corpo em objeto', () => {
    filter.catch(
      new HttpException(
        { statusCode: 400, message: ['email inválido'], error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: ['email inválido'],
    });
  });

  it('retorna 500 para erros não mapeados', () => {
    filter.catch(new Error('inesperado'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
