import { describe, expect, it } from 'vitest';

import {
  FINE_PER_DAY_INR,
  LOAN_DAYS,
  MAX_ACTIVE_LOANS,
} from '@/config/library-rules';

describe('library rules', () => {
  it('exports the configured loan rules', () => {
    expect(MAX_ACTIVE_LOANS).toBe(3);
    expect(LOAN_DAYS).toBe(14);
    expect(FINE_PER_DAY_INR).toBe(5);
  });
});
