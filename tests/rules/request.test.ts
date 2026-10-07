import { describe, expect, it } from 'vitest';

import { canRequestBook } from '@/lib/rules/request';

describe('book requests', () => {
  it('blocks duplicate requests first', () => {
    expect(
      canRequestBook({
        activeCount: 0,
        hasActiveLoanForBook: true,
        availableCopies: 1,
      }),
    ).toEqual({ ok: false, reason: 'duplicate_request' });
  });

  it('blocks unavailable books', () => {
    expect(
      canRequestBook({
        activeCount: 0,
        hasActiveLoanForBook: false,
        availableCopies: 0,
      }),
    ).toEqual({ ok: false, reason: 'no_copies_available' });
  });

  it.each([3, 4])('blocks %s active loans', (activeCount) => {
    expect(
      canRequestBook({
        activeCount,
        hasActiveLoanForBook: false,
        availableCopies: 1,
      }),
    ).toEqual({ ok: false, reason: 'loan_limit_reached' });
  });

  it('allows two active loans', () => {
    expect(
      canRequestBook({
        activeCount: 2,
        hasActiveLoanForBook: false,
        availableCopies: 1,
      }),
    ).toEqual({ ok: true, value: undefined });
  });

  it('checks duplicate before availability and availability before cap', () => {
    expect(
      canRequestBook({
        activeCount: 3,
        hasActiveLoanForBook: true,
        availableCopies: 0,
      }),
    ).toEqual({ ok: false, reason: 'duplicate_request' });
    expect(
      canRequestBook({
        activeCount: 3,
        hasActiveLoanForBook: false,
        availableCopies: 0,
      }),
    ).toEqual({ ok: false, reason: 'no_copies_available' });
  });

  it.each([
    { activeCount: -1, hasActiveLoanForBook: false, availableCopies: 1 },
    { activeCount: 1.5, hasActiveLoanForBook: false, availableCopies: 1 },
    { activeCount: 1, hasActiveLoanForBook: false, availableCopies: -1 },
    { activeCount: 1, hasActiveLoanForBook: false, availableCopies: 1.5 },
  ])(
    'rejects invalid numeric input: $activeCount/$availableCopies',
    (input) => {
      expect(() => canRequestBook(input)).toThrow(RangeError);
    },
  );
});
