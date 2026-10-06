import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FINE_PER_DAY_INR,
  LOAN_DAYS,
  MAX_ACTIVE_LOANS,
} from '@/config/library-rules';
import {
  approveLoan,
  cancelLoan,
  markFinePaid,
  rejectLoan,
  requestLoan,
  returnLoan,
} from '@/lib/db/loans';
import { deleteBook, updateBookCopies } from '@/lib/db/books';
import type { RpcClient, RpcResult } from '@/lib/db/types';

type RpcCall = {
  name: string;
  params: Record<string, unknown>;
};

const createFakeClient = (
  result: RpcResult = { ok: true, id: 'result-id' },
): RpcClient & { calls: RpcCall[] } => {
  const calls: RpcCall[] = [];

  return {
    calls,
    async rpc<T>(name: string, params: Record<string, unknown>) {
      calls.push({ name, params });
      return { data: result as T, error: null };
    },
  };
};

describe('database wrappers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes request configuration and parameter names to request_loan', async () => {
    const client = createFakeClient();

    await requestLoan(client, 'member-id', 'book-id');

    expect(client.calls).toEqual([
      {
        name: 'request_loan',
        params: {
          p_member: 'member-id',
          p_book: 'book-id',
          p_max_loans: MAX_ACTIVE_LOANS,
        },
      },
    ]);
  });

  it('passes configured values and today to loan lifecycle RPCs', async () => {
    const client = createFakeClient();

    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));

    await approveLoan(client, 'loan-id');
    await rejectLoan(client, 'loan-id');
    await cancelLoan(client, 'loan-id', 'member-id');
    await returnLoan(client, 'loan-id');
    await markFinePaid(client, 'loan-id');

    expect(client.calls).toEqual([
      {
        name: 'approve_loan',
        params: {
          p_loan: 'loan-id',
          p_loan_days: LOAN_DAYS,
          p_today: '2026-10-06',
        },
      },
      { name: 'reject_loan', params: { p_loan: 'loan-id' } },
      {
        name: 'cancel_loan',
        params: { p_loan: 'loan-id', p_member: 'member-id' },
      },
      {
        name: 'return_loan',
        params: {
          p_loan: 'loan-id',
          p_fine_per_day: FINE_PER_DAY_INR,
          p_today: '2026-10-06',
        },
      },
      { name: 'mark_fine_paid', params: { p_loan: 'loan-id' } },
    ]);
  });

  it('passes configured values to book RPCs', async () => {
    const client = createFakeClient();

    await updateBookCopies(client, 'book-id', 5);
    await deleteBook(client, 'book-id');

    expect(client.calls).toEqual([
      {
        name: 'update_book_copies',
        params: { p_book: 'book-id', p_new_total: 5 },
      },
      { name: 'delete_book', params: { p_book: 'book-id' } },
    ]);
  });

  it('passes RPC failures through unchanged', async () => {
    const failure: RpcResult = { ok: false, reason: 'duplicate_request' };
    const client = createFakeClient(failure);

    await expect(requestLoan(client, 'member-id', 'book-id')).resolves.toEqual(
      failure,
    );
  });
});
