import { ApiProperty } from '@nestjs/swagger';

export class SeedCountDto {
  @ApiProperty({ example: 5 })
  count: number;
}

export class SeedSummaryDto {
  @ApiProperty({ type: SeedCountDto })
  clientes: SeedCountDto;

  @ApiProperty({ type: SeedCountDto })
  veiculos: SeedCountDto;

  @ApiProperty({ type: SeedCountDto })
  servicos: SeedCountDto;

  @ApiProperty({ type: SeedCountDto })
  estoque: SeedCountDto;
}
