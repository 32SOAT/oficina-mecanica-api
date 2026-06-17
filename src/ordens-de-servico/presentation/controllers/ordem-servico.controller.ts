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
import { type AuthenticatedRequest } from '../../../auth/authenticated-request.interface';
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
  criar(@Req() req: AuthenticatedRequest, @Body() dto: CriarOrdemServicoDto) {
    return this.createOrdemServicoUseCase.execute(
      OrdemServicoPresentationMapper.toCreateInput(dto),
      req.user.sub,
    );
  }

  @Get()
  listar(@Query() filtros: FiltrosOrdemServicoDto) {
    return this.findAllOrdensServicoUseCase.execute(
      OrdemServicoPresentationMapper.toFiltrosInput(filtros),
    );
  }

  @Get(':id')
  detalhar(@Param('id', ParseUUIDPipe) id: string) {
    return this.findOrdemServicoByIdUseCase.execute(id);
  }

  @Get(':id/historico')
  historico(@Param('id', ParseUUIDPipe) id: string) {
    return this.findOrdemServicoHistoricoUseCase.execute(id);
  }

  @Post(':id/iniciar-diagnostico')
  iniciarDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.EmDiagnostico,
      req.user.sub,
    );
  }

  @Patch(':id/itens')
  substituirItensEmDiagnostico(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditarItensOsDto,
  ) {
    return this.substituirItensOrdemServicoUseCase.execute(
      id,
      OrdemServicoPresentationMapper.toEditarItensInput(dto),
      req.user.sub,
    );
  }

  @Post(':id/gerar-orcamento')
  gerarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gerarOrcamentoOrdemServicoUseCase.execute(id, req.user.sub);
  }

  @Post(':id/aprovar-orcamento')
  aprovarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aprovarOrcamentoOrdemServicoUseCase.execute(id, req.user.sub);
  }

  @Post(':id/reprovar-orcamento')
  reprovarOrcamento(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reprovarOrcamentoOrdemServicoUseCase.execute(id, req.user.sub);
  }

  @Post(':id/iniciar-execucao')
  iniciarExecucao(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.iniciarExecucaoOrdemServicoUseCase.execute(id, req.user.sub);
  }

  @Post(':id/finalizar')
  finalizar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Finalizada,
      req.user.sub,
    );
  }

  @Post(':id/entregar')
  entregar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Entregue,
      req.user.sub,
    );
  }

  @Post(':id/cancelar')
  cancelar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transicionarOrdemServicoUseCase.execute(
      id,
      StatusOrdemServico.Cancelada,
      req.user.sub,
    );
  }

  @Post(':id/avancar-status')
  avancar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AvancarStatusDto,
  ) {
    return this.avancarStatusOrdemServicoUseCase.execute(
      id,
      body.novoStatus,
      req.user.sub,
    );
  }
}
