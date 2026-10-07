import { describe, expect, it } from 'vitest';

import {
  addDays,
  diffInDays,
  parseCalendarDate,
  toCalendarDate,
} from '@/lib/rules/dates';

describe('calendar dates', () => {
  it('parses valid dates into numeric parts', () => {
    expect(parseCalendarDate('2026-03-05')).toEqual({
      year: 2026,
      month: 3,
      day: 5,
    });
  });

  it.each(['2026-02-30', '2026-2-03', 'not-a-date', '2026-01-01T00:00:00Z'])(
    'rejects invalid date %s',
    (date) => {
      expect(() => parseCalendarDate(date)).toThrow(RangeError);
    },
  );

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('adds days across a leap day', () => {
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('calculates signed day differences', () => {
    expect(diffInDays('2026-03-05', '2026-03-07')).toBe(2);
    expect(diffInDays('2026-03-07', '2026-03-05')).toBe(-2);
  });

  it('converts an instant into the application timezone', () => {
    const instant = new Date('2026-03-01T20:00:00Z');

    expect(toCalendarDate(instant)).toBe('2026-03-02');
    expect(toCalendarDate(instant, 'UTC')).toBe('2026-03-01');
  });
});
