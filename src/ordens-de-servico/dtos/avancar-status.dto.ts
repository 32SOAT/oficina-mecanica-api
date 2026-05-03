import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusOrdemServico } from '../state-machine/status-ordem-servico.enum';

export class AvancarStatusDto {
  @ApiProperty({
    enum: StatusOrdemServico,
    description: 'Novo status desejado',
  })
  @IsEnum(StatusOrdemServico)
  novoStatus: StatusOrdemServico;
}
