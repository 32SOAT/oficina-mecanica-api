import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEstoqueInput } from '../dto/create-estoque.input';
import { EstoqueOutput } from '../dto/estoque.output';
import { Estoque } from '../../domain/estoque';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';
import {
  ORDEM_SERVICO_REPOSICAO_PORT,
  OrdemServicoReposicaoPort,
} from '../ports/ordem-servico-reposicao.port';

@Injectable()
export class CreateEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
    @Inject(ORDEM_SERVICO_REPOSICAO_PORT)
    private readonly ordemServicoReposicaoPort: OrdemServicoReposicaoPort,
  ) {}

  async execute(input: CreateEstoqueInput): Promise<EstoqueOutput> {
    if (await this.estoqueRepository.existsByCodigo(input.codigo)) {
      throw new ConflictException(
        'Código já está em uso por outro item de estoque.',
      );
    }

    const estoque = Estoque.create(input);
    const saved = await this.estoqueRepository.save(estoque);
    await this.ordemServicoReposicaoPort.tentarLiberarOsAposReposicao(
      [saved.id],
      null,
    );
    return saved;
  }
}
