import { describe, expect, it } from 'vitest';

import {
  getPageRange,
  parsePageParam,
  sanitizeSearchTerm,
} from '@/lib/query/helpers';

describe('query helpers', () => {
  it('sanitizes PostgREST and ilike metacharacters', () => {
    expect(sanitizeSearchTerm(' a,id.eq.1 %_\\()* ')).toBe('aid.eq.1');
    expect(sanitizeSearchTerm('x'.repeat(101))).toHaveLength(100);
  });

  it.each([
    [undefined, 1],
    ['', 1],
    ['0', 1],
    ['-1', 1],
    ['abc', 1],
    ['10001', 10000],
    ['12', 12],
  ])('parses page %s', (input, expected) => {
    expect(parsePageParam(input)).toBe(expected);
  });

  it('calculates a page range', () => {
    expect(getPageRange(3, 12)).toEqual({ from: 24, to: 35 });
  });
});
