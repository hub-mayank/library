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
    <article className="rounded border p-4" key={loan.id}>
      <div className="flex gap-3">
        {loan.books?.isbn ? (
          <BookCover isbn={loan.books.isbn} title={loan.books.title} small />
        ) : null}
        <div>
          <h3 className="font-semibold">
            {loan.books?.title ?? 'Unknown book'}
          </h3>
          <p className="text-sm">Status: {loan.status}</p>
          {loan.due_date && loan.status === 'issued' ? (
            <p>
              {calculateDaysLate(loan.due_date, today)
                ? `Overdue by ${calculateDaysLate(loan.due_date, today)} days`
                : 'Not overdue'}
            </p>
          ) : null}
        </div>
      </div>
      {loan.fine > 0 ? (
        <p>
          Fine: ₹{loan.fine}
          {loan.fine_paid ? ' (paid)' : ''}
        </p>
      ) : null}
      {loan.status === 'pending' ? (
        <form action={cancelBookLoan} className="mt-3">
          <input type="hidden" name="loanId" value={loan.id} />
          <button className="rounded border px-3 py-1" type="submit">
            Cancel
          </button>
        </form>
      ) : null}
    </article>
  );
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">My books</h1>
      {params.message ? (
        <p className="my-4 rounded border p-3" role="status">
          {params.message}
        </p>
      ) : null}
      <p className="my-4">Unpaid fines: ₹{unpaid}</p>
      <h2 className="mb-3 text-2xl font-semibold">Current</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {current.length ? current.map(card) : <p>No current loans.</p>}
      </div>
      <h2 className="mb-3 mt-10 text-2xl font-semibold">History</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {history.length ? history.map(card) : <p>No loan history.</p>}
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
