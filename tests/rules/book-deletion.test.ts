import { describe, expect, it } from 'vitest';

import { canDeleteBook } from '@/lib/rules/book-deletion';

describe('book deletion', () => {
  it.each([
    [false, false, { ok: true, value: undefined }],
    [true, false, { ok: false, reason: 'has_active_loans' }],
    [false, true, { ok: false, reason: 'has_unpaid_fines' }],
    [true, true, { ok: false, reason: 'has_active_loans' }],
  ] as const)('checks loans before fines', (hasLoans, hasFine, expected) => {
    expect(
      canDeleteBook({
        hasPendingOrIssuedLoans: hasLoans,
        hasUnpaidFine: hasFine,
      }),
    ).toEqual(expected);
  });
});
