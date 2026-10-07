import { describe, expect, it } from 'vitest';

import {
  getDashboardStats,
  getMostBorrowedBooks,
  getOldestPendingRequests,
  getOverdueLoans,
  type DashboardLoan,
} from '@/lib/services/dashboard';

const loan = (overrides: Partial<DashboardLoan> = {}): DashboardLoan => ({
  id: '1',
  status: 'issued',
  due_date: '2026-10-05',
  returned_on: null,
  fine: 0,
  fine_paid: false,
  requested_at: '2026-10-01T00:00:00Z',
  book_id: 'book-1',
  book_title: 'Alpha',
  member_name: 'Member',
  ...overrides,
});

describe('dashboard aggregations', () => {
  it('does not call a loan due today overdue, but does call one day late overdue', () => {
    expect(
      getOverdueLoans([loan({ due_date: '2026-10-06' })], '2026-10-06'),
    ).toHaveLength(0);
    expect(getOverdueLoans([loan()], '2026-10-06')[0].daysLate).toBe(1);
  });

  it('never calls a returned loan overdue', () => {
    expect(
      getOverdueLoans([loan({ status: 'returned' })], '2026-10-06'),
    ).toHaveLength(0);
  });

  it('orders tied most-borrowed books by title', () => {
    expect(
      getMostBorrowedBooks([
        loan({ book_id: 'b', book_title: 'Beta' }),
        loan({ book_id: 'a', book_title: 'Alpha' }),
      ]),
    ).toEqual([
      { title: 'Alpha', count: 1 },
      { title: 'Beta', count: 1 },
    ]);
  });

  it('orders oldest pending requests by date and then title', () => {
    expect(
      getOldestPendingRequests([
        loan({ id: 'b', status: 'pending', book_title: 'Beta' }),
        loan({ id: 'a', status: 'pending', book_title: 'Alpha' }),
        loan({
          id: 'c',
          status: 'pending',
          book_title: 'Earlier',
          requested_at: '2026-09-30T00:00:00Z',
        }),
      ]).map(({ id }) => id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('adds unpaid fines and returns zeroes for empty data', () => {
    expect(
      getDashboardStats(
        [],
        [
          loan({ status: 'returned', fine: 10 }),
          loan({ status: 'returned', fine: 5 }),
        ],
        0,
      ).unpaidFines,
    ).toBe(15);
    expect(getDashboardStats([], [], 0)).toEqual({
      totalBooks: 0,
      totalCopies: 0,
      availableCopies: 0,
      members: 0,
      pendingRequests: 0,
      currentlyIssued: 0,
      overdueCount: 0,
      unpaidFines: 0,
    });
  });
});
