import { approve, payFine, reject, returnBook } from './actions';
import { Pagination } from '@/components/Pagination';
import { FINE_PER_DAY_INR } from '@/config/library-rules';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateDaysLate } from '@/lib/rules/fines';
import { toCalendarDate } from '@/lib/rules/dates';
import { PAGE_SIZE } from '@/config/app';
import { getPageRange, parsePageParam } from '@/lib/query/helpers';
import { getPageInfo } from '@/lib/query/pagination';
import { redirect } from 'next/navigation';
import { BookCover } from '@/components/BookCover';

const tabs = [
  'pending',
  'issued',
  'overdue',
  'fines',
  'returned',
  'rejected',
  'cancelled',
] as const;

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; message?: string; page?: string }>;
}) {
  await requireRole('librarian', '/issues');
  const params = await searchParams;
  const tab = tabs.includes(params.tab as (typeof tabs)[number])
    ? params.tab
    : 'pending';
  const today = toCalendarDate(new Date());
  const supabase = await createSupabaseServerClient();
  const requestedPage = parsePageParam(params.page);
  let query = supabase
    .from('loans')
    .select('id', { count: 'exact', head: true });
  if (tab === 'overdue')
    query = query.eq('status', 'issued').lt('due_date', today);
  else if (tab === 'fines')
    query = query.eq('status', 'returned').gt('fine', 0).eq('fine_paid', false);
  else query = query.eq('status', tab);
  const { count } = await query;
  const pageInfo = getPageInfo(count ?? 0, requestedPage, PAGE_SIZE);
  if (pageInfo.page !== requestedPage)
    redirect(
      `/issues?tab=${tab}${pageInfo.page > 1 ? `&page=${pageInfo.page}` : ''}`,
    );
  const { from, to } = getPageRange(pageInfo.page, PAGE_SIZE);
  let loansQuery = supabase
    .from('loans')
    .select('*, books(title, isbn), profiles(name)')
    .range(from, to)
    .order('requested_at', { ascending: false });
  if (tab === 'overdue')
    loansQuery = loansQuery.eq('status', 'issued').lt('due_date', today);
  else if (tab === 'fines')
    loansQuery = loansQuery
      .eq('status', 'returned')
      .gt('fine', 0)
      .eq('fine_paid', false);
  else loansQuery = loansQuery.eq('status', tab);
  const { data: loans } = await loansQuery;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
        Librarian workspace
      </p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">Issues</h1>
      {params.message ? (
        <p
          className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900"
          role="status"
        >
          {params.message}
        </p>
      ) : null}
      <nav
        aria-label="Issue status"
        className="my-8 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2 shadow-sm"
      >
        {tabs.map((item) => (
          <a
            aria-current={tab === item ? 'page' : undefined}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium capitalize ${tab === item ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'}`}
            href={`/issues?tab=${item}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>
      {!loans?.length ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-600 shadow-sm">
          No loans in this view.
        </p>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const overdue = loan.due_date
              ? calculateDaysLate(loan.due_date, today)
              : 0;
            return (
              <article
                className="rounded-2xl border bg-white p-4 shadow-sm"
                key={loan.id}
              >
                <div className="flex gap-3">
                  {loan.books?.isbn ? (
                    <BookCover
                      isbn={loan.books.isbn}
                      title={loan.books.title}
                      small
                    />
                  ) : null}
                  <h2 className="font-semibold">
                    {loan.books?.title ?? 'Unknown book'}
                  </h2>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {loan.profiles?.name ?? 'Unknown member'}{' '}
                  <span className="mx-1 text-slate-300">·</span>{' '}
                  <span className="font-medium capitalize text-slate-900">
                    {loan.status}
                  </span>
                </p>
                {overdue ? (
                  <p>
                    Overdue by {overdue} days · Fine ₹
                    {overdue * FINE_PER_DAY_INR}
                  </p>
                ) : null}
                {loan.fine ? (
                  <p>
                    Fine: ₹{loan.fine}
                    {loan.fine_paid ? ' (paid)' : ''}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {loan.status === 'pending' ? (
                    <>
                      <form action={approve}>
                        <input type="hidden" name="loanId" value={loan.id} />
                        <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
                          Approve
                        </button>
                      </form>
                      <form action={reject}>
                        <input type="hidden" name="loanId" value={loan.id} />
                        <button className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
                          Reject
                        </button>
                      </form>
                    </>
                  ) : null}
                  {loan.status === 'issued' ? (
                    <form action={returnBook}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
                        Return
                      </button>
                    </form>
                  ) : null}
                  {loan.status === 'returned' &&
                  loan.fine > 0 &&
                  !loan.fine_paid ? (
                    <form action={payFine}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <button className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
                        Mark paid
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Pagination
        basePath="/issues"
        currentParams={{ tab }}
        pageInfo={pageInfo}
        total={count ?? 0}
      />
    </div>
  );
}
