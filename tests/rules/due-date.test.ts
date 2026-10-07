import { describe, expect, it } from 'vitest';

import { getDueDate } from '@/lib/rules/due-date';

describe('due dates', () => {
  it.each([
    ['normal case', '2026-03-01', '2026-03-15'],
    ['month rollover', '2026-03-20', '2026-04-03'],
    ['year rollover', '2026-12-25', '2027-01-08'],
    ['leap year', '2028-02-20', '2028-03-05'],
  ])('calculates the %s', (_label, issuedOn, expected) => {
    expect(getDueDate(issuedOn)).toBe(expected);
  });
});
