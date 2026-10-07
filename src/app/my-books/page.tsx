import { cancelBookLoan } from '@/app/books/actions';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateDaysLate } from '@/lib/rules/fines';
import { toCalendarDate } from '@/lib/rules/dates';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/config/app';
import { getPageRange, parsePageParam } from '@/lib/query/helpers';
import { getPageInfo } from '@/lib/query/pagination';
import { redirect } from 'next/navigation';
import { BookCover } from '@/components/BookCover';

export default async function MyBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; page?: string }>;
}) {
  const user = await requireRole('member', '/my-books');
  const supabase = await createSupabaseServerClient();
  const { data: loans } = await supabase
    .from('loans')
    .select('*, books(title, author, isbn)')
    .eq('member_id', user.id)
    .order('requested_at', { ascending: false });
  const current =
    loans?.filter((loan) => ['pending', 'issued'].includes(loan.status)) ?? [];
  const allHistory =
    loans?.filter((loan) =>
      ['returned', 'rejected', 'cancelled'].includes(loan.status),
    ) ?? [];
  const params = await searchParams;
  const requestedPage = parsePageParam(params.page);
  const pageInfo = getPageInfo(allHistory.length, requestedPage, PAGE_SIZE);
  if (pageInfo.page !== requestedPage)
    redirect(`/my-books${pageInfo.page > 1 ? `?page=${pageInfo.page}` : ''}`);
  const { from, to } = getPageRange(pageInfo.page, PAGE_SIZE);
  const history = allHistory.slice(from, to + 1);
  const today = toCalendarDate(new Date());
  const unpaid =
    loans
      ?.filter((loan) => loan.status === 'returned' && !loan.fine_paid)
      .reduce((sum, loan) => sum + loan.fine, 0) ?? 0;
  const card = (loan: (typeof current)[number]) => (
    <article
      className="rounded-2xl border bg-white p-4 shadow-sm"
      key={loan.id}
    >
      <div className="flex gap-3">
        {loan.books?.isbn ? (
          <BookCover isbn={loan.books.isbn} title={loan.books.title} small />
        ) : null}
        <div>
          <h3 className="font-semibold">
            {loan.books?.title ?? 'Unknown book'}
          </h3>
          <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
            {loan.status}
          </span>
          {loan.due_date && loan.status === 'issued' ? (
            <p className="mt-2 text-sm font-medium text-slate-600">
              {calculateDaysLate(loan.due_date, today)
                ? `Overdue by ${calculateDaysLate(loan.due_date, today)} days`
                : 'Not overdue'}
            </p>
          ) : null}
        </div>
      </div>
      {loan.fine > 0 ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
          Fine: ₹{loan.fine}
          {loan.fine_paid ? ' (paid)' : ''}
        </p>
      ) : null}
      {loan.status === 'pending' ? (
        <form action={cancelBookLoan} className="mt-3">
          <input type="hidden" name="loanId" value={loan.id} />
          <button
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            type="submit"
          >
            Cancel
          </button>
        </form>
      ) : null}
    </article>
  );
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
        Your reading list
      </p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">My books</h1>
      {params.message ? (
        <p
          className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900"
          role="status"
        >
          {params.message}
        </p>
      ) : null}
      <p className="my-6 inline-flex rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">
        Unpaid fines:{' '}
        <span className="ml-1 font-bold text-rose-700">₹{unpaid}</span>
      </p>
      <h2 className="mb-3 text-2xl font-semibold">Current loans</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {current.length ? (
          current.map(card)
        ) : (
          <p className="rounded-2xl border bg-white p-8 text-slate-600 shadow-sm">
            No current loans.
          </p>
        )}
      </div>
      <h2 className="mb-3 mt-10 text-2xl font-semibold">History</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {history.length ? (
          history.map(card)
        ) : (
          <p className="rounded-2xl border bg-white p-8 text-slate-600 shadow-sm">
            No loan history.
          </p>
        )}
      </div>
      <Pagination
        basePath="/my-books"
        currentParams={{}}
        pageInfo={pageInfo}
        total={allHistory.length}
      />
    </div>
  );
}
