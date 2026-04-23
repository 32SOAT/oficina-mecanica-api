export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_NUMBER = 25;

export const DefaultPageSize = {
  CLIENTE: 10,
  USER: 10,
} as const satisfies Record<string, number>;
