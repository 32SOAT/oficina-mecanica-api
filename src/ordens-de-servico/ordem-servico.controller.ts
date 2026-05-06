import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdemServicoService } from './ordem-servico.service';
import { CriarOrdemServicoDto } from './dtos/criar-ordem-servico.dto';
import { EditarItensOsDto } from './dtos/editar-itens-os.dto';
import { FiltrosOrdemServicoDto } from './dtos/filtros-ordem-servico.dto';
import { AvancarStatusDto } from './dtos/avancar-status.dto';
import { type AuthenticatedRequest } from '../auth/authenticated-request.interface';

@ApiBearerAuth('JWT-auth')
@ApiTags('Ordens de Serviço (admin)')
@Controller('ordens')
export class OrdemServicoController {
  constructor(private readonly service: OrdemServicoService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova OS',
    description:
      'Abre OS em RECEBIDA com itens de serviço e/ou peças. Cada linha de peça incrementa `quantidade_reservada` ' +
      'no cadastro mesmo quando o físico momentâneo é insuficiente; nesse caso a OS recebe aviso padrão na `observacao` ' +
      'para o cliente (compra pendente). Após entrada de estoque, OSs em AGUARDANDO_PECAS_INSUMOS podem ir para AGUARDANDO_SERVICO.',
  })
  @ApiBody({ type: CriarOrdemServicoDto })
  @ApiResponse({
    status: 400,
    description:
      'Payload inválido ou regras de negócio (documento, placa, itens).',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente, veículo ou item referenciado não encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito (ex.: veículo não pertence ao cliente).',
  })
  criar(@Req() req: AuthenticatedRequest, @Body() dto: CriarOrdemServicoDto) {
    return this.service.criar(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista OSs com paginação e filtros',
    description:
      'Query opcional: page, take, status, clienteId, dataInicio, dataFim (vide schema).',
  })
  listar(@Query() filtros: FiltrosOrdemServicoDto) {
    return this.service.findAll(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma OS (com cliente, veículo e itens)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  detalhar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Histórico de transições de status da OS' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  historico(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findHistorico(id);
  }

  @Post(':id/iniciar-diagnostico')
  @ApiOperation({ summary: 'Inicia o diagnóstico (Recebida → EmDiagnostico)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de status inválida para o estado atual.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  iniciarDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.iniciarDiagnostico(id, req.user.sub);
  }

  @Patch(':id/itens')
  @ApiOperation({
    summary: 'Substitui todos os itens da OS durante o diagnóstico',
    description:
      'Só permitido em EM_DIAGNOSTICO. Estorna o compromisso de reserva das linhas antigas e reserva integralmente as novas quantidades mesmo se o físico for insuficiente no momento. ' +
      'Recalcula valor total e mescla/remove o aviso padrão na `observacao` quando há falta de peça física.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiBody({ type: EditarItensOsDto })
  @ApiResponse({
    status: 400,
    description:
      'OS não está em diagnóstico, sem itens válidos ou regra de negócio (estoque).',
  })
  @ApiResponse({
    status: 404,
    description: 'OS, serviço ou peça não encontrada.',
  })
  substituirItensEmDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditarItensOsDto,
  ) {
    return this.service.substituirItensEmDiagnostico(id, dto, req.user.sub);
  }

  @Post(':id/gerar-orcamento')
  @ApiOperation({
    summary: 'Gera/atualiza o orçamento e move para AguardandoAprovacao',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida ou OS não está em diagnóstico.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  gerarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.gerarOrcamento(id, req.user.sub);
  }

  @Post(':id/aprovar-orcamento')
  @ApiOperation({
    summary:
      'Aprova o orçamento; OS avança para AguardandoServico ou AguardandoPecasInsumos',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida (ex.: não está aguardando aprovação).',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  aprovarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.aprovarOrcamento(id, req.user.sub);
  }

  @Post(':id/reprovar-orcamento')
  @ApiOperation({
    summary:
      'Reprova o orçamento; reservas de estoque são estornadas (status Reprovada)',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida para o estado atual.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  reprovarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.reprovarOrcamento(id, req.user.sub);
  }

  @Post(':id/iniciar-execucao')
  @ApiOperation({
    summary: 'Inicia a execução; baixa de estoque das peças reservadas',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida ou estoque insuficiente.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  iniciarExecucao(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.iniciarExecucao(id, req.user.sub);
  }

  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Conclui a execução (EmExecucao → Finalizada)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida para o estado atual.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  finalizar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.finalizar(id, req.user.sub);
  }

  @Post(':id/entregar')
  @ApiOperation({
    summary: 'Registra retirada do veículo (Finalizada → Entregue)',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida para o estado atual.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  entregar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.entregar(id, req.user.sub);
  }

  @Post(':id/cancelar')
  @ApiOperation({
    summary: 'Cancela a OS a partir de Reprovada (Reprovada → Cancelada)',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida para o estado atual.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  cancelar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancelar(id, req.user.sub);
  }

  @Post(':id/avancar-status')
  @ApiOperation({
    summary: 'Transição genérica de status',
    description:
      'Avança para um status permitido pela máquina de estados; falha com 400 se a transição não for válida.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID da ordem de serviço',
  })
  @ApiBody({ type: AvancarStatusDto })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida ou corpo inválido.',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  avancar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AvancarStatusDto,
  ) {
    return this.service.avancarStatus(id, body.novoStatus, req.user.sub);
  }
}
