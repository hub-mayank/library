import { calculateDaysLate, calculateFine } from '@/lib/rules/fines';
import { toCalendarDate } from '@/lib/rules/dates';

export type DashboardLoan = {
  id: string;
  status: string;
  due_date: string | null;
  returned_on: string | null;
  fine: number;
  fine_paid: boolean;
  requested_at: string;
  book_id: string;
  book_title: string;
  member_name: string;
};

export type DashboardBook = {
  id: string;
  title: string;
  total_copies: number;
  available_copies: number;
};

export type DashboardStats = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  members: number;
  pendingRequests: number;
  currentlyIssued: number;
  overdueCount: number;
  unpaidFines: number;
};

export const getOverdueLoans = (
  loans: DashboardLoan[],
  today: string = toCalendarDate(new Date()),
) =>
  loans
    .filter(
      (loan) =>
        loan.status === 'issued' &&
        loan.due_date !== null &&
        loan.due_date < today,
    )
    .map((loan) => ({
      ...loan,
      daysLate: calculateDaysLate(loan.due_date as string, today),
      liveFine: calculateFine(loan.due_date as string, today),
    }))
    .sort(
      (a, b) =>
        b.daysLate - a.daysLate || a.book_title.localeCompare(b.book_title),
    )
    .slice(0, 5);

export const getOldestPendingRequests = (loans: DashboardLoan[]) =>
  loans
    .filter((loan) => loan.status === 'pending')
    .sort(
      (a, b) =>
        a.requested_at.localeCompare(b.requested_at) ||
        a.book_title.localeCompare(b.book_title),
    )
    .slice(0, 5);

const countOverdueLoans = (loans: DashboardLoan[], today: string): number =>
  loans.filter(
    (loan) =>
      loan.status === 'issued' &&
      loan.due_date !== null &&
      loan.due_date < today,
  ).length;

export const getMostBorrowedBooks = (loans: DashboardLoan[]) => {
  const counts = new Map<string, { title: string; count: number }>();
  for (const loan of loans) {
    if (loan.status === 'rejected' || loan.status === 'cancelled') continue;
    const current = counts.get(loan.book_id) ?? {
      title: loan.book_title,
      count: 0,
    };

    current.count += 1;
    counts.set(loan.book_id, current);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, 5);
};

export const getDashboardStats = (
  books: DashboardBook[],
  loans: DashboardLoan[],
  members: number,
  today: string = toCalendarDate(new Date()),
): DashboardStats => ({
  totalBooks: books.length,
  totalCopies: books.reduce((sum, book) => sum + book.total_copies, 0),
  availableCopies: books.reduce((sum, book) => sum + book.available_copies, 0),
  members,
  pendingRequests: loans.filter((loan) => loan.status === 'pending').length,
  currentlyIssued: loans.filter((loan) => loan.status === 'issued').length,
  overdueCount: countOverdueLoans(loans, today),
  unpaidFines: loans
    .filter((loan) => loan.status === 'returned' && !loan.fine_paid)
    .reduce((sum, loan) => sum + loan.fine, 0),
});
