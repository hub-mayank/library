import { describe, expect, it } from 'vitest';

import {
  computeAvailableOnEdit,
  issueCopy,
  returnCopy,
} from '@/lib/rules/copies';

describe('book copies', () => {
  it('issues copies down to zero, then throws', () => {
    expect(issueCopy(1)).toBe(0);
    expect(() => issueCopy(0)).toThrow(RangeError);
  });

  it('returns copies up to total, then throws', () => {
    expect(returnCopy(1, 2)).toBe(2);
    expect(() => returnCopy(2, 2)).toThrow(RangeError);
  });

  it.each([
    [3, 1, 5, { ok: true, value: 3 }],
    [3, 1, 2, { ok: true, value: 0 }],
    [3, 1, 1, { ok: false, reason: 'below_issued_count' }],
    [3, 1, 0, { ok: false, reason: 'invalid_total' }],
    [3, 1, 2.5, { ok: false, reason: 'invalid_total' }],
  ] as const)(
    'computes edited availability for %s/%s -> %s',
    (oldTotal, oldAvailable, newTotal, expected) => {
      expect(computeAvailableOnEdit(oldTotal, oldAvailable, newTotal)).toEqual(
        expected,
      );
    },
  );
});
