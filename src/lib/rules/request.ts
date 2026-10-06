import { MAX_ACTIVE_LOANS } from '@/config/library-rules';

import { fail, ok, Result } from './result';

type RequestInput = {
  activeCount: number;
  hasActiveLoanForBook: boolean;
  availableCopies: number;
};

const assertNonNegativeInteger = (value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`Expected a non-negative integer: ${value}`);
  }
};

export const canRequestBook = (
  input: RequestInput,
): Result<
  void,
  'duplicate_request' | 'no_copies_available' | 'loan_limit_reached'
> => {
  assertNonNegativeInteger(input.activeCount);
  assertNonNegativeInteger(input.availableCopies);

  if (input.hasActiveLoanForBook) {
    return fail('duplicate_request');
  }
  if (input.availableCopies === 0) {
    return fail('no_copies_available');
  }
  if (input.activeCount >= MAX_ACTIVE_LOANS) {
    return fail('loan_limit_reached');
  }

  return ok(undefined);
};
