import { describe, expect, it } from 'vitest';

import { buildPageHref, getPageInfo } from '@/lib/query/pagination';

describe('pagination', () => {
  it('preserves other params and omits the first page', () => {
    const params = new URLSearchParams({
      q: 'history',
      category: 'History',
      page: '3',
    });
    expect(buildPageHref('/books', params, 2)).toBe(
      '/books?q=history&category=History&page=2',
    );
    expect(buildPageHref('/books', params, 1)).toBe(
      '/books?q=history&category=History',
    );
  });

  it('clamps pages and handles empty and exact totals', () => {
    expect(getPageInfo(25, 99, 12)).toEqual({
      totalPages: 3,
      page: 3,
      hasPrev: true,
      hasNext: false,
    });
    expect(getPageInfo(0, 1, 12).totalPages).toBe(1);
    expect(getPageInfo(24, 2, 12).totalPages).toBe(2);
  });
});
