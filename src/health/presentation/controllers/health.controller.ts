import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';
import { HealthResponseDto } from '../dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verifica se a API está online',
    description:
      'Endpoint de health check que retorna o status da aplicação e um timestamp atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'API online.',
    schema: {
      type: 'object',
      properties: {
        data: {
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
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  check(): HealthResponseDto {
    return HealthResponseDto.fromOutput(this.checkHealthUseCase.execute());
  }
}
