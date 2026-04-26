import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationService],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateOffset', () => {
    it('should calculate offset correctly', () => {
      expect(service.calculateOffset(10, 1)).toBe(0);
      expect(service.calculateOffset(10, 2)).toBe(10);
      expect(service.calculateOffset(5, 3)).toBe(10);
    });
  });

  describe('createMeta', () => {
    it('should create pagination meta correctly', () => {
      const meta = service.createMeta(10, 1, 25);
      expect(meta).toEqual({
        itemsPerPage: 10,
        totalItems: 25,
        currentPage: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should return undefined if page exceeds total pages', () => {
      const meta = service.createMeta(10, 5, 25);
      expect(meta).toBeUndefined();
    });

    it('should handle last page correctly', () => {
      const meta = service.createMeta(10, 3, 25);
      expect(meta).toEqual({
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
