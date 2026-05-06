import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

const envelopeDescription =
  'Resposta HTTP após o interceptor global: o valor retornado pelo handler fica na propriedade `data`.';

export function ApiDataResponse(
  type: Type<unknown>,
  status = 200,
  description = 'Resposta com sucesso',
) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        description: envelopeDescription,
        properties: {
          data: { $ref: getSchemaPath(type) },
        },
        required: ['data'],
      },
    }),
  );
}

export function ApiPaginatedResponse(
  type: Type<unknown>,
  status = 200,
  description = 'Lista paginada',
) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        description:
          'Lista e metadados de paginação. O interceptor repassa este formato sem envolver em outro `data`.',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(type) },
          },
          meta: {
            type: 'object',
            properties: {
              itemsPerPage: { type: 'number' },
              totalItems: { type: 'number' },
              currentPage: { type: 'number' },
              totalPages: { type: 'number' },
              hasNextPage: { type: 'boolean' },
              hasPreviousPage: { type: 'boolean' },
            },
          },
        },
        required: ['data', 'meta'],
      },
    }),
  );
}

export function ApiWrappedResponse(
  type?: Type<unknown>,
  status = 200,
  description = 'Resposta com sucesso',
) {
  const payloadProps: Record<string, object> = {
    success: {
      type: 'boolean',
      example: true,
      description: 'Indica sucesso da operação.',
    },
    message: {
      type: 'string',
      example: 'Operação concluída.',
      description: 'Mensagem para o cliente.',
    },
  };
  const payloadRequired: string[] = ['success', 'message'];

  if (type) {
    payloadProps.data = {
      $ref: getSchemaPath(type),
      description: 'Conteúdo principal da resposta.',
    };
    payloadRequired.push('data');
  }

  return applyDecorators(
    ...(type ? [ApiExtraModels(type)] : []),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        description: `${envelopeDescription} O campo "data" (raiz) contém o objeto do controller com success, message e, quando aplicável, o recurso no campo homônimo "data".`,
        properties: {
          data: {
            type: 'object',
            description:
              'Objeto retornado pelo controller (`success`, `message` e, se houver, `data` com o recurso).',
            properties: payloadProps,
            required: payloadRequired,
          },
        },
        required: ['data'],
      },
    }),
  );
}
