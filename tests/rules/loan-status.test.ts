import { describe, expect, it } from 'vitest';

import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  isActive,
  LoanStatus,
} from '@/lib/rules/loan-status';

const statuses: LoanStatus[] = [
  'pending',
  'issued',
  'returned',
  'rejected',
  'cancelled',
];

describe('loan status transitions', () => {
  it.each([
    ['pending', 'issued'],
    ['pending', 'rejected'],
    ['pending', 'cancelled'],
    ['issued', 'returned'],
  ] as const)('allows %s to %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('rejects every other transition', () => {
    for (const from of statuses) {
      for (const to of statuses) {
        const allowed =
          (from === 'pending' &&
            (to === 'issued' || to === 'rejected' || to === 'cancelled')) ||
          (from === 'issued' && to === 'returned');

        if (!allowed) {
          expect(canTransition(from, to)).toBe(false);
          expect(() => assertTransition(from, to)).toThrow(
            InvalidTransitionError,
          );
        }
      }
    }
  });

  it.each([
    ['pending', true],
    ['issued', true],
    ['returned', false],
    ['rejected', false],
    ['cancelled', false],
  ] as const)('reports %s active status correctly', (status, active) => {
    expect(isActive(status)).toBe(active);
  });
});
