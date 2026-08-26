import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class FiltrosEstoqueDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar itens com estoque baixo (disponível <= 5).',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  estoque_baixo?: boolean;
}
