import {
  FINE_PER_DAY_INR,
  LOAN_DAYS,
  MAX_ACTIVE_LOANS,
} from '@/config/library-rules';
import { toCalendarDate } from '@/lib/rules/dates';

import type { RpcClient, RpcResult } from './types';

const rpc = async <T extends RpcResult>(
  client: RpcClient,
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> => {
  const { data, error } = await client.rpc<T>(functionName, params);

  if (error) {
    throw new Error(`Supabase RPC ${functionName} failed: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Supabase RPC ${functionName} returned no data`);
  }

  return data;
};

const today = (): string => toCalendarDate(new Date());

export const requestLoan = (
  client: RpcClient,
  memberId: string,
  bookId: string,
): Promise<RpcResult> =>
  rpc(client, 'request_loan', {
    p_member: memberId,
    p_book: bookId,
    p_max_loans: MAX_ACTIVE_LOANS,
  });

export const approveLoan = (
  client: RpcClient,
  loanId: string,
): Promise<RpcResult> =>
  rpc(client, 'approve_loan', {
    p_loan: loanId,
    p_loan_days: LOAN_DAYS,
    p_today: today(),
  });

export const rejectLoan = (
  client: RpcClient,
  loanId: string,
): Promise<RpcResult> => rpc(client, 'reject_loan', { p_loan: loanId });

export const cancelLoan = (
  client: RpcClient,
  loanId: string,
  memberId: string,
): Promise<RpcResult> =>
  rpc(client, 'cancel_loan', {
    p_loan: loanId,
    p_member: memberId,
  });

export const returnLoan = (
  client: RpcClient,
  loanId: string,
): Promise<RpcResult> =>
  rpc(client, 'return_loan', {
    p_loan: loanId,
    p_fine_per_day: FINE_PER_DAY_INR,
    p_today: today(),
  });

export const markFinePaid = (
  client: RpcClient,
  loanId: string,
): Promise<RpcResult> => rpc(client, 'mark_fine_paid', { p_loan: loanId });
