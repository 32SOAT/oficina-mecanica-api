import { Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiWrappedResponse } from '../../common/decorators/swagger-response.decorator';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { SeedSummaryDto } from './dto/seed-summary.dto';
import { SeedingService } from './seeding.service';

@ApiTags('Seeding')
@Controller('seeding')
export class SeedingController {
  constructor(private readonly seedingService: SeedingService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Executa o seed das tabelas',
    description:
      'Popula clientes, veiculos, servicos e estoque. A ordem de servico deve ser criada pelo usuario.',
  })
  @ApiBody({
    required: false,
    description: 'Body vazio ({}). Nao enviar campos.',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
      example: {},
    },
  })
  @ApiWrappedResponse(SeedSummaryDto, 200, 'Seed executado com sucesso')
  async seed() {
    const seedResult = await this.seedingService.seed();
    return {
      success: true,
      message: seedResult.message,
      data: {
        clientes: { count: seedResult.clientes.count },
        veiculos: { count: seedResult.veiculos.count },
        servicos: { count: seedResult.servicos.count },
        estoque: { count: seedResult.estoque.count },
      },
    };
  }
}
