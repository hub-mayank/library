import type { RpcFailureReason } from '@/lib/db/types';

export const rpcFailureMessage: Record<RpcFailureReason, string> = {
  duplicate_request: 'You already have an active request for this book.',
  no_copies_available: 'There are no available copies right now.',
  loan_limit_reached: 'You have reached the active loan limit.',
  below_issued_count:
    'Total copies cannot be below the number currently issued.',
  invalid_total: 'Enter a valid total copy count.',
  has_active_loans: 'This book has active loans and cannot be deleted.',
  has_unpaid_fines: 'This book has unpaid fines and cannot be deleted.',
  not_found: 'The requested record could not be found.',
  invalid_status: 'That action is no longer available.',
  forbidden: 'You are not allowed to perform that action.',
  book_has_history: 'Books with loan history cannot be deleted.',
  invalid_isbn: 'Enter a valid ISBN.',
};
