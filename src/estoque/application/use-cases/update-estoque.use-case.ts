import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEstoqueInput } from '../dto/update-estoque.input';
import { EstoqueOutput } from '../dto/estoque.output';
import { EstoqueOutputMapper } from '../mappers/estoque-output.mapper';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class UpdateEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number, input: UpdateEstoqueInput): Promise<EstoqueOutput> {
    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    if (input.codigo && input.codigo !== existing.codigo) {
      if (await this.estoqueRepository.existsByCodigo(input.codigo, id)) {
        throw new ConflictException(
          'Código já está em uso por outro item de estoque.',
        );
      }
    }

    const estoque = EstoqueOutputMapper.toDomain(existing).atualizarCadastro(
      input,
    );
    return this.estoqueRepository.save(estoque);
  }
}
