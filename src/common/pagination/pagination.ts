export interface PaginationMeta {
  readonly itemsPerPage: number;
  readonly totalItems: number;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_NUMBER = 25;
