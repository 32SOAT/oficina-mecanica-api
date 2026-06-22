import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('converts query params to numbers before validating', () => {
    const paginationDto = plainToInstance(PaginationDto, {
      page: '2',
      take: '10',
    });

    const errors = validateSync(paginationDto);

    expect(errors).toHaveLength(0);
    expect(paginationDto.page).toBe(2);
    expect(paginationDto.take).toBe(10);
  });
});
