import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiDataResponse(
  type: Type<unknown>,
  status = 200,
  description = 'Successful response',
) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          data: { $ref: getSchemaPath(type) },
        },
      },
    }),
  );
}

export function ApiPaginatedResponse(
  type: Type<unknown>,
  status = 200,
  description = 'Paginated response',
) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
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
      },
    }),
  );
}

export function ApiWrappedResponse(
  type?: Type<unknown>,
  status = 200,
  description = 'Successful response',
) {
  const decorators = type ? [ApiExtraModels(type)] : [];
  const properties: Record<string, any> = {
    success: { type: 'boolean' },
    message: { type: 'string' },
  };

  if (type) {
    properties.data = { $ref: getSchemaPath(type) };
  }

  return applyDecorators(
    ...decorators,
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties,
          },
        },
      },
    }),
  );
}
