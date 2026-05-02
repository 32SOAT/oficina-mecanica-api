import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdemServicoService } from './ordem-servico.service';
import { CriarOrdemServicoDto } from './dtos/criar-ordem-servico.dto';
import { FiltrosOrdemServicoDto } from './dtos/filtros-ordem-servico.dto';
import { AvancarStatusDto } from './dtos/avancar-status.dto';

@ApiTags('Ordens de Serviço (admin)')
@Controller('ordens')
export class OrdemServicoController {
  constructor(private readonly service: OrdemServicoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova OS' })
  criar(@Body() dto: CriarOrdemServicoDto) {
    return this.service.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista OSs com paginação e filtros' })
  listar(@Query() filtros: FiltrosOrdemServicoDto) {
    return this.service.findAll(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma OS' })
  detalhar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Histórico de transições da OS' })
  historico(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findHistorico(id);
  }

  @Post(':id/iniciar-diagnostico')
  @ApiOperation({ summary: 'Inicia o diagnóstico (Recebida → EmDiagnostico)' })
  iniciarDiagnostico(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.iniciarDiagnostico(id);
  }

  @Post(':id/gerar-orcamento')
  @ApiOperation({
    summary: 'Gera/atualiza o orçamento e move para AguardandoAprovacao',
  })
  gerarOrcamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.gerarOrcamento(id);
  }

  @Post(':id/aprovar-orcamento')
  @ApiOperation({
    summary:
      'Cliente aprova o orçamento; OS avança para AguardandoServico ou AguardandoPecasInsumos',
  })
  aprovarOrcamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.aprovarOrcamento(id);
  }

  @Post(':id/reprovar-orcamento')
  @ApiOperation({
    summary: 'Cliente reprova o orçamento; reservas de estoque são estornadas',
  })
  reprovarOrcamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.reprovarOrcamento(id);
  }

  @Post(':id/iniciar-execucao')
  @ApiOperation({
    summary: 'Mecânico inicia a execução; baixa de estoque é dada',
  })
  iniciarExecucao(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.iniciarExecucao(id);
  }

  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Conclui a execução (EmExecucao → Finalizada)' })
  finalizar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.finalizar(id);
  }

  @Post(':id/entregar')
  @ApiOperation({ summary: 'Cliente retira o veículo (Finalizada → Entregue)' })
  entregar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.entregar(id);
  }

  @Post(':id/cancelar')
  @ApiOperation({
    summary: 'Veículo devolvido após reprovação (Reprovada → Cancelada)',
  })
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancelar(id);
  }

  @Post(':id/avancar-status')
  @ApiOperation({ summary: 'Transição genérica (admin)' })
  avancar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AvancarStatusDto,
  ) {
    return this.service.avancarStatus(id, body.novoStatus);
  }
}
