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
    .select('*, books(title), profiles(name)')
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Issues</h1>
      {params.message ? (
        <p className="my-4 rounded border p-3" role="status">
          {params.message}
        </p>
      ) : null}
      <nav aria-label="Issue status" className="my-6 flex flex-wrap gap-3">
        {tabs.map((item) => (
          <a
            aria-current={tab === item ? 'page' : undefined}
            className="underline"
            href={`/issues?tab=${item}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>
      {!loans?.length ? (
        <p className="rounded border p-6">No loans in this view.</p>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const overdue = loan.due_date
              ? calculateDaysLate(loan.due_date, today)
              : 0;
            return (
              <article className="rounded border p-4" key={loan.id}>
                <h2 className="font-semibold">
                  {loan.books?.title ?? 'Unknown book'}
                </h2>
                <p>
                  {loan.profiles?.name ?? 'Unknown member'} · {loan.status}
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
                        <button className="rounded bg-blue-700 px-3 py-1 text-white">
                          Approve
                        </button>
                      </form>
                      <form action={reject}>
                        <input type="hidden" name="loanId" value={loan.id} />
                        <button className="rounded border px-3 py-1">
                          Reject
                        </button>
                      </form>
                    </>
                  ) : null}
                  {loan.status === 'issued' ? (
                    <form action={returnBook}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <button className="rounded bg-blue-700 px-3 py-1 text-white">
                        Return
                      </button>
                    </form>
                  ) : null}
                  {loan.status === 'returned' &&
                  loan.fine > 0 &&
                  !loan.fine_paid ? (
                    <form action={payFine}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <button className="rounded border px-3 py-1">
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
