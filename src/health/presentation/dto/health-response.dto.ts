import { ApiProperty } from '@nestjs/swagger';
import { HealthOutput } from '../../application/dto/health.output';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: 'ok';

  @ApiProperty({
    format: 'date-time',
    example: '2023-10-01T12:00:00.000Z',
  })
  timestamp: string;

  static fromOutput(output: HealthOutput): HealthResponseDto {
    return Object.assign(new HealthResponseDto(), output);
  }
}
