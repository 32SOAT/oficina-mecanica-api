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
import { type AuthenticatedRequest } from '../../../auth/presentation/interfaces/authenticated-request.interface';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { AprovarOrcamentoOrdemServicoUseCase } from '../../application/use-cases/aprovar-orcamento-ordem-servico.use-case';
import { AvancarStatusOrdemServicoUseCase } from '../../application/use-cases/avancar-status-ordem-servico.use-case';
import { CreateOrdemServicoUseCase } from '../../application/use-cases/create-ordem-servico.use-case';
import { FindAllOrdensServicoUseCase } from '../../application/use-cases/find-all-ordens-servico.use-case';
import { FindOrdemServicoByIdUseCase } from '../../application/use-cases/find-ordem-servico-by-id.use-case';
import { FindOrdemServicoHistoricoUseCase } from '../../application/use-cases/find-ordem-servico-historico.use-case';
import { GerarOrcamentoOrdemServicoUseCase } from '../../application/use-cases/gerar-orcamento-ordem-servico.use-case';
import { IniciarExecucaoOrdemServicoUseCase } from '../../application/use-cases/iniciar-execucao-ordem-servico.use-case';
import { ReprovarOrcamentoOrdemServicoUseCase } from '../../application/use-cases/reprovar-orcamento-ordem-servico.use-case';
import { SubstituirItensOrdemServicoUseCase } from '../../application/use-cases/substituir-itens-ordem-servico.use-case';
import { TransicionarOrdemServicoUseCase } from '../../application/use-cases/transicionar-ordem-servico.use-case';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { AvancarStatusDto } from '../dto/avancar-status.dto';
import { CriarOrdemServicoDto } from '../dto/criar-ordem-servico.dto';
import { EditarItensOsDto } from '../dto/editar-itens-os.dto';
import { FiltrosOrdemServicoDto } from '../dto/filtros-ordem-servico.dto';
import { HistoricoStatusResponseDto } from '../dto/historico-status-response.dto';
import { OrdemServicoResponseDto } from '../dto/ordem-servico-response.dto';
import { OrdemServicoPresentationMapper } from '../mappers/ordem-servico-presentation.mapper';

@ApiBearerAuth('JWT-auth')
@ApiTags('Ordens de Serviço (admin)')
@Controller('ordens')
export class OrdemServicoController {
  constructor(
    private readonly createOrdemServicoUseCase: CreateOrdemServicoUseCase,
    private readonly findAllOrdensServicoUseCase: FindAllOrdensServicoUseCase,
    private readonly findOrdemServicoByIdUseCase: FindOrdemServicoByIdUseCase,
    private readonly findOrdemServicoHistoricoUseCase: FindOrdemServicoHistoricoUseCase,
    private readonly transicionarOrdemServicoUseCase: TransicionarOrdemServicoUseCase,
    private readonly substituirItensOrdemServicoUseCase: SubstituirItensOrdemServicoUseCase,
    private readonly gerarOrcamentoOrdemServicoUseCase: GerarOrcamentoOrdemServicoUseCase,
    private readonly aprovarOrcamentoOrdemServicoUseCase: AprovarOrcamentoOrdemServicoUseCase,
    private readonly reprovarOrcamentoOrdemServicoUseCase: ReprovarOrcamentoOrdemServicoUseCase,
    private readonly iniciarExecucaoOrdemServicoUseCase: IniciarExecucaoOrdemServicoUseCase,
    private readonly avancarStatusOrdemServicoUseCase: AvancarStatusOrdemServicoUseCase,
  ) {}

  @Post()
  async criar(@Req() req: AuthenticatedRequest, @Body() dto: CriarOrdemServicoDto) {
    const os = await this.createOrdemServicoUseCase.execute(
      OrdemServicoPresentationMapper.toCreateInput(dto),
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar ordens de serviço',
    description:
      'Listagem operacional: exclui OS finalizadas, entregues e canceladas (use query `status` para incluí-las). ' +
      'Ordenação: Em Execução → Aguardando Serviço → Aguardando Peças/Insumos → Aguardando Aprovação → Diagnóstico → Recebida; dentro de cada status, mais antigas primeiro.',
  })
  async listar(@Query() filtros: FiltrosOrdemServicoDto) {
    const result = await this.findAllOrdensServicoUseCase.execute(
      OrdemServicoPresentationMapper.toFiltrosInput(filtros),
    );
    return {
      data: result.data.map(OrdemServicoResponseDto.fromReadModel),
      meta: result.meta,
    };
  }

  @Get(':id')
  async detalhar(@Param('id', ParseUUIDPipe) id: string) {
    const os = await this.findOrdemServicoByIdUseCase.execute(id);
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Get(':id/historico')
  async historico(@Param('id', ParseUUIDPipe) id: string) {
    const historico = await this.findOrdemServicoHistoricoUseCase.execute(id);
    return historico.map(HistoricoStatusResponseDto.fromReadModel);
  }

  @Post(':id/iniciar-diagnostico')
  async iniciarDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.EmDiagnostico,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Patch(':id/itens')
  async substituirItensEmDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditarItensOsDto,
  ) {
    const os = await this.substituirItensOrdemServicoUseCase.execute(
      id,
      OrdemServicoPresentationMapper.toEditarItensInput(dto),
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/gerar-orcamento')
  async gerarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.gerarOrcamentoOrdemServicoUseCase.execute(
      id,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Public()
  @Post(':id/aprovar-orcamento')
  @ApiOperation({
    summary: 'Aprovar orçamento (público)',
    description:
      'Permite ao cliente aprovar o orçamento sem autenticação JWT. O histórico registra usuário nulo.',
  })
  async aprovarOrcamento(@Param('id', ParseUUIDPipe) id: string) {
    const os = await this.aprovarOrcamentoOrdemServicoUseCase.execute(id, null);
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Public()
  @Post(':id/reprovar-orcamento')
  @ApiOperation({
    summary: 'Reprovar orçamento (público)',
    description:
      'Permite ao cliente reprovar o orçamento sem autenticação JWT. O histórico registra usuário nulo.',
  })
  async reprovarOrcamento(@Param('id', ParseUUIDPipe) id: string) {
    const os = await this.reprovarOrcamentoOrdemServicoUseCase.execute(id, null);
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/iniciar-execucao')
  async iniciarExecucao(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.iniciarExecucaoOrdemServicoUseCase.execute(
      id,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/finalizar')
  async finalizar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Finalizada,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/entregar')
  async entregar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Entregue,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/cancelar')
  async cancelar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const os = await this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Cancelada,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }

  @Post(':id/avancar-status')
  async avancar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AvancarStatusDto,
  ) {
    const os = await this.avancarStatusOrdemServicoUseCase.execute(
      id,
      body.novoStatus,
      req.user.sub,
    );
    return OrdemServicoResponseDto.fromReadModel(os);
  }
}
