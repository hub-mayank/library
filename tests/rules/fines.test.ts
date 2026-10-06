import { describe, expect, it } from 'vitest';

import { calculateDaysLate, calculateFine } from '@/lib/rules/fines';

describe('fines', () => {
  it.each([
    ['before due date', '2026-03-10', '2026-03-09', 0, 0],
    ['on due date', '2026-03-10', '2026-03-10', 0, 0],
    ['one day late', '2026-03-10', '2026-03-11', 1, 5],
    ['fourteen days late', '2026-03-10', '2026-03-24', 14, 70],
    ['thirty days late', '2026-03-10', '2026-04-09', 30, 150],
    ['across a month boundary', '2026-03-10', '2026-04-01', 22, 110],
    ['across a year boundary', '2026-03-10', '2027-01-02', 298, 1490],
    ['around a DST start date', '2026-03-08', '2026-03-09', 1, 5],
    ['around a DST end date', '2026-11-01', '2026-11-02', 1, 5],
  ])('%s uses calendar days', (_label, dueDate, returned, days, fine) => {
    expect(calculateDaysLate(dueDate, returned)).toBe(days);
    expect(calculateFine(dueDate, returned)).toBe(fine);
  });
});
