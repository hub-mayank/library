import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getDashboardStats,
  getMostBorrowedBooks,
  getOldestPendingRequests,
  getOverdueLoans,
  type DashboardLoan,
} from '@/lib/services/dashboard';
import { toCalendarDate } from '@/lib/rules/dates';

export default async function DashboardPage() {
  await requireRole('librarian', '/dashboard');
  const supabase = await createSupabaseServerClient();
  const [{ data: books }, { data: rawLoans }, { count: members }] =
    await Promise.all([
      supabase.from('books').select('id,title,total_copies,available_copies'),
      supabase
        .from('loans')
        .select(
          'id,status,due_date,returned_on,fine,fine_paid,requested_at,book_id,books(title),profiles(name)',
        ),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'member'),
    ]);
  const loans: DashboardLoan[] = (rawLoans ?? []).map((loan) => ({
    id: loan.id,
    status: loan.status,
    due_date: loan.due_date,
    returned_on: loan.returned_on,
    fine: loan.fine,
    fine_paid: loan.fine_paid,
    requested_at: loan.requested_at,
    book_id: loan.book_id,
    book_title: loan.books?.[0]?.title ?? 'Unknown book',
    member_name: loan.profiles?.[0]?.name ?? 'Unknown member',
  }));
  const today = toCalendarDate(new Date());
  const stats = getDashboardStats(books ?? [], loans, members ?? 0, today);
  const overdue = getOverdueLoans(loans, today);
  const pending = getOldestPendingRequests(loans);
  const borrowed = getMostBorrowedBooks(loans);
  const cards = [
    ['Total books', stats.totalBooks],
    ['Total copies', stats.totalCopies],
    ['Copies available', stats.availableCopies],
    ['Members', stats.members],
    ['Pending requests', stats.pendingRequests],
    ['Currently issued', stats.currentlyIssued],
    ['Overdue', stats.overdueCount],
    ['Unpaid fines', `₹${stats.unpaidFines}`],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div className="rounded border p-4" key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <section>
          <h2 className="text-xl font-semibold">Overdue loans</h2>
          <ul className="mt-3 space-y-2">
            {overdue.map((loan) => (
              <li className="rounded border p-3" key={loan.id}>
                {loan.member_name} · {loan.book_title} · {loan.daysLate} days
                late · ₹{loan.liveFine}
              </li>
            ))}
            {!overdue.length ? <li>No overdue loans.</li> : null}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Pending requests</h2>
          <ul className="mt-3 space-y-2">
            {pending.map((loan) => (
              <li className="rounded border p-3" key={loan.id}>
                {loan.member_name} · {loan.book_title}
              </li>
            ))}
            {!pending.length ? <li>No pending requests.</li> : null}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Most borrowed books</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {borrowed.map((book) => (
              <li key={book.title}>
                {book.title} · {book.count}
              </li>
            ))}
            {!borrowed.length ? <li>No borrowing history.</li> : null}
          </ol>
        </section>
      </div>
    </div>
  );
}
