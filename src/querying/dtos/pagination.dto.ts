import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { MAX_PAGE_NUMBER, MAX_PAGE_SIZE } from '../constants';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(MAX_PAGE_SIZE)
  readonly take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(MAX_PAGE_NUMBER)
  readonly page?: number = 1;
}
