import { fail, ok, Result } from './result';

type BookDeletionInput = {
  hasPendingOrIssuedLoans: boolean;
  hasUnpaidFine: boolean;
};

export const canDeleteBook = (
  input: BookDeletionInput,
): Result<void, 'has_active_loans' | 'has_unpaid_fines'> => {
  if (input.hasPendingOrIssuedLoans) {
    return fail('has_active_loans');
  }
  if (input.hasUnpaidFine) {
    return fail('has_unpaid_fines');
  }

  return ok(undefined);
};
