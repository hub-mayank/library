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
    {
      label: 'Total books',
      value: stats.totalBooks,
      detail: 'Titles in the catalogue',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Total copies',
      value: stats.totalCopies,
      detail: 'Books on the shelves',
      accent: 'bg-sky-500',
    },
    {
      label: 'Copies available',
      value: stats.availableCopies,
      detail: 'Ready to borrow',
      accent: 'bg-teal-500',
    },
    {
      label: 'Members',
      value: stats.members,
      detail: 'Active community members',
      accent: 'bg-violet-500',
    },
    {
      label: 'Pending requests',
      value: stats.pendingRequests,
      detail: 'Waiting for review',
      accent: 'bg-amber-500',
    },
    {
      label: 'Currently issued',
      value: stats.currentlyIssued,
      detail: 'Books out with members',
      accent: 'bg-indigo-500',
    },
    {
      label: 'Overdue',
      value: stats.overdueCount,
      detail: 'Need a gentle nudge',
      accent: 'bg-rose-500',
    },
    {
      label: 'Unpaid fines',
      value: `₹${stats.unpaidFines}`,
      detail: 'Outstanding balance',
      accent: 'bg-orange-500',
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-3xl bg-emerald-950 px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Librarian overview
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Dashboard
            </h1>
            <p className="mt-3 max-w-xl text-emerald-100">
              A quick pulse on your library today, from new requests to books
              that need to come home.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-800 bg-emerald-900/60 px-4 py-3 text-sm text-emerald-100">
            <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Collection health
            </span>
            <span className="mt-1 block text-2xl font-bold text-white">
              {stats.totalCopies
                ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
                : 0}
              %
            </span>
            <span>of copies available</span>
          </div>
        </div>
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div
            className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            key={card.label}
          >
            <span className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
            <dt className="text-sm font-medium text-slate-500">{card.label}</dt>
            <dd className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {card.value}
            </dd>
            <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Attention needed
              </p>
              <h2 className="mt-1 text-xl font-semibold">Overdue loans</h2>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700">
              {overdue.length}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {overdue.map((loan) => (
              <li
                className="rounded-xl bg-rose-50/80 p-3 text-sm text-rose-950"
                key={loan.id}
              >
                <span className="block font-semibold">{loan.book_title}</span>
                <span className="mt-1 block text-rose-800">
                  {loan.member_name} · {loan.daysLate} days late · ₹
                  {loan.liveFine}
                </span>
              </li>
            ))}
            {!overdue.length ? (
              <li className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                Everything is on track. No overdue loans.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Queue
              </p>
              <h2 className="mt-1 text-xl font-semibold">Pending requests</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
              {pending.length}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {pending.map((loan) => (
              <li
                className="rounded-xl bg-amber-50/80 p-3 text-sm text-amber-950"
                key={loan.id}
              >
                <span className="block font-semibold">{loan.book_title}</span>
                <span className="mt-1 block text-amber-800">
                  Requested by {loan.member_name}
                </span>
              </li>
            ))}
            {!pending.length ? (
              <li className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No requests are waiting for review.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            Reader favourites
          </p>
          <h2 className="mt-1 text-xl font-semibold">Most borrowed books</h2>
          <ol className="mt-4 space-y-3">
            {borrowed.map((book, index) => (
              <li className="flex items-center gap-3" key={book.title}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {book.title}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {book.count}
                </span>
              </li>
            ))}
            {!borrowed.length ? (
              <li className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Borrowing history will appear here.
              </li>
            ) : null}
          </ol>
        </section>
      </div>
    </div>
  );
}
