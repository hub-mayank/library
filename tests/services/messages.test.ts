import { describe, expect, it } from 'vitest';

import { rpcFailureMessage } from '@/lib/actions/messages';
import type { RpcFailureReason } from '@/lib/db/types';

const reasons: RpcFailureReason[] = [
  'duplicate_request',
  'no_copies_available',
  'loan_limit_reached',
  'below_issued_count',
  'invalid_total',
  'has_active_loans',
  'has_unpaid_fines',
  'not_found',
  'invalid_status',
  'forbidden',
  'book_has_history',
  'invalid_isbn',
];

describe('RPC failure messages', () => {
  it('has a non-empty message for every failure reason', () => {
    for (const reason of reasons) {
      expect(rpcFailureMessage[reason]).toBeTruthy();
    }
  });
});
