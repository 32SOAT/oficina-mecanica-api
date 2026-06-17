import { PaginationMeta } from './pagination';

export function calculateOffset(take: number, page: number): number {
  return (page - 1) * take;
}

export function createPaginationMeta(
  take: number,
  page: number,
  count: number,
): PaginationMeta | undefined {
  const totalPages = Math.ceil(count / take);
  if (page > totalPages) {
    return undefined;
  }

  return {
    itemsPerPage: take,
    totalItems: count,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
