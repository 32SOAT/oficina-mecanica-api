import { Injectable } from '@nestjs/common';
import { PaginationMeta } from './interfaces/pagination-meta.interface';

@Injectable()
export class PaginationService {
  calculateOffset(take: number, page: number) {
    return (page - 1) * take;
  }

  createMeta(
    take: number,
    page: number,
    count: number,
  ): PaginationMeta | undefined {
    const totalPages = Math.ceil(count / take);
    if (page > totalPages) return;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    return {
      itemsPerPage: take,
      totalItems: count,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
