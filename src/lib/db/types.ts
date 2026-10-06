import type { PostgrestError } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  name: string;
  role: 'member' | 'librarian';
  created_at: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category:
    | 'Fiction'
    | 'Science'
    | 'Technology'
    | 'History'
    | 'Biography'
    | 'Self Help'
    | 'Children';
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
};

export type Loan = {
  id: string;
  book_id: string;
  member_id: string;
  status: 'pending' | 'issued' | 'returned' | 'rejected' | 'cancelled';
  requested_at: string;
  issued_on: string | null;
  due_date: string | null;
  returned_on: string | null;
  fine: number;
  fine_paid: boolean;
};

export type RpcFailureReason =
  | 'duplicate_request'
  | 'no_copies_available'
  | 'loan_limit_reached'
  | 'below_issued_count'
  | 'invalid_total'
  | 'has_active_loans'
  | 'has_unpaid_fines'
  | 'not_found'
  | 'invalid_status'
  | 'forbidden'
  | 'book_has_history'
  | 'invalid_isbn';

export type RpcResult =
  { ok: true; id: string } | { ok: false; reason: RpcFailureReason };

export type RpcClient = {
  rpc<T>(
    functionName: string,
    params: Record<string, unknown>,
  ): PromiseLike<{
    data: T | null;
    error: PostgrestError | null;
  }>;
};
