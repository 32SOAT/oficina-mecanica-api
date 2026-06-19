import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationError } from '../../application/errors/application.errors';
import { EstoqueOperacaoInvalidaError } from '../../../estoque/domain/errors/estoque-operacao-invalida.error';
import { ReservaPecaInvalidaError } from '../../../ordens-de-servico/domain/errors/reserva-peca-invalida.error';
import { TransicaoInvalidaError } from '../../../ordens-de-servico/domain/errors/transicao-invalida.error';
import { InvalidPrecoMaoDeObraError } from '../../../servicos/domain/errors/invalid-preco-mao-de-obra.error';

type HttpErrorPayload = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

function resolveHttpError(exception: unknown): HttpErrorPayload | null {
  if (exception instanceof ApplicationError) {
    return {
      statusCode: exception.statusCode,
      message: exception.message,
    };
  }

  if (
    exception instanceof TransicaoInvalidaError ||
    exception instanceof ReservaPecaInvalidaError ||
    exception instanceof EstoqueOperacaoInvalidaError ||
    exception instanceof InvalidPrecoMaoDeObraError
  ) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
    };
  }

  return null;
}

function resolveNestHttpException(exception: HttpException): HttpErrorPayload {
  const statusCode = exception.getStatus();
  const body = exception.getResponse();

  if (typeof body === 'string') {
    return { statusCode, message: body };
  }

  if (typeof body === 'object' && body !== null) {
    const payload = body as Record<string, unknown>;
    return {
      statusCode,
      message: (payload.message as string | string[]) ?? exception.message,
      error: payload.error as string | undefined,
    };
  }

  return { statusCode, message: exception.message };
}

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const resolved =
      resolveHttpError(exception) ??
      (exception instanceof HttpException
        ? resolveNestHttpException(exception)
        : null);

    if (resolved) {
      response.status(resolved.statusCode).json({
        statusCode: resolved.statusCode,
        ...(resolved.error ? { error: resolved.error } : {}),
        message: resolved.message,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}