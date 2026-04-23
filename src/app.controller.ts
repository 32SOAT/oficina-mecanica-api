import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Verifica se a API está online',
    description:
      'Endpoint de health check que retorna o status da aplicação e um timestamp atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando corretamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2023-10-01T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  check(): object {
    return this.appService.check();
  }
}
