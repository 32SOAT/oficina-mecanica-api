import { calculateOffset, createPaginationMeta } from './pagination.util';

describe('pagination util', () => {
  describe('calculateOffset', () => {
    it('calculates offset correctly', () => {
      expect(calculateOffset(10, 1)).toBe(0);
      expect(calculateOffset(10, 2)).toBe(10);
      expect(calculateOffset(5, 3)).toBe(10);
    });
  });

  describe('createPaginationMeta', () => {
    it('creates pagination meta correctly', () => {
      expect(createPaginationMeta(10, 1, 25)).toEqual({
        itemsPerPage: 10,
        totalItems: 25,
        currentPage: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('returns undefined if page exceeds total pages', () => {
      expect(createPaginationMeta(10, 5, 25)).toBeUndefined();
    });

    it('handles last page correctly', () => {
      expect(createPaginationMeta(10, 3, 25)).toEqual({
        itemsPerPage: 10,
        totalItems: 25,
        currentPage: 3,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });
});
