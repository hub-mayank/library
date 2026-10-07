import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Pagination } from '@/components/Pagination';
import { BookCover } from '@/components/BookCover';
import { CATEGORIES } from '@/config/categories';
import { MAX_ACTIVE_LOANS } from '@/config/library-rules';
import { PAGE_SIZE } from '@/config/app';
import { requireUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getPageRange,
  parsePageParam,
  sanitizeSearchTerm,
} from '@/lib/query/helpers';
import { buildPageHref, getPageInfo } from '@/lib/query/pagination';
import { requestBook, removeBook } from './actions';

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    message?: string;
  }>;
}) {
  const user = await requireUser('/books');
  const params = await searchParams;
  const query = sanitizeSearchTerm(params.q ?? '');
  const category = CATEGORIES.includes(
    params.category as (typeof CATEGORIES)[number],
  )
    ? params.category
    : undefined;
  const requestedPage = parsePageParam(params.page);
  const supabase = await createSupabaseServerClient();
  const { from, to } = getPageRange(requestedPage, PAGE_SIZE);
  let booksQuery = supabase
    .from('books')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('title');
  if (query)
    booksQuery = booksQuery.or(
      `title.ilike.%${query}%,author.ilike.%${query}%`,
    );
  if (category) booksQuery = booksQuery.eq('category', category);
  const { data: books, count } = await booksQuery;
  const pageInfo = getPageInfo(count ?? 0, requestedPage, PAGE_SIZE);
  if (pageInfo.page !== requestedPage) {
    redirect(
      buildPageHref(
        '/books',
        { q: params.q, category: params.category },
        pageInfo.page,
      ),
    );
  }
  const { count: activeCount } =
    user.role === 'member'
      ? await supabase
          .from('loans')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', user.id)
          .in('status', ['pending', 'issued'])
      : { count: null };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            The catalogue
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            Find your next read
          </h1>
          <p className="mt-2 text-slate-600">
            Browse the shelves and make your next request.
          </p>
        </div>
        {user.role === 'librarian' ? (
          <Link
            className="rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white shadow-sm hover:bg-emerald-900"
            href="/books/new"
          >
            Add book
          </Link>
        ) : (
          <span className="rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-sm">
            <span className="text-emerald-800">{activeCount ?? 0}</span> /{' '}
            {MAX_ACTIVE_LOANS} active loans
          </span>
        )}
      </div>
      {params.message ? (
        <p
          className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900"
          role="status"
        >
          {params.message}
        </p>
      ) : null}
      <form
        className="my-8 flex flex-wrap gap-3 rounded-2xl border bg-white p-4 shadow-sm"
        method="get"
      >
        <input
          className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 sm:min-w-64"
          name="q"
          defaultValue={params.q}
          placeholder="Search title or author"
        />
        <select
          className="rounded-xl border px-3 py-2.5"
          name="category"
          defaultValue={category ?? ''}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl bg-emerald-800 px-5 py-2.5 font-semibold text-white hover:bg-emerald-900"
          type="submit"
        >
          Search
        </button>
        <Link
          className="rounded-xl px-4 py-2.5 text-slate-600 hover:bg-slate-100"
          href="/books"
        >
          Clear
        </Link>
      </form>
      {!books?.length ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-600 shadow-sm">
          No books found.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <article
              className="group flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              key={book.id}
            >
              <div className="flex gap-4">
                <BookCover isbn={book.isbn} title={book.title} />
                <div>
                  <h2 className="text-xl font-semibold leading-tight group-hover:text-emerald-800">
                    {book.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                {book.category} <span className="mx-1 text-slate-300">·</span>{' '}
                ISBN {book.isbn}
              </p>
              <p className="mt-auto pt-5 text-sm font-medium">
                <span
                  className={
                    book.available_copies ? 'text-emerald-700' : 'text-rose-700'
                  }
                >
                  {book.available_copies} available
                </span>{' '}
                <span className="text-slate-400">
                  of {book.total_copies} copies
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {user.role === 'member' ? (
                  <form action={requestBook}>
                    <input type="hidden" name="bookId" value={book.id} />
                    <button
                      disabled={book.available_copies === 0}
                      className="rounded-xl bg-emerald-800 px-3 py-2 font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {book.available_copies ? 'Request' : 'No copies'}
                    </button>
                  </form>
                ) : (
                  <>
                    <Link className="underline" href={`/books/${book.id}/edit`}>
                      Edit
                    </Link>
                    <form action={removeBook}>
                      <input type="hidden" name="bookId" value={book.id} />
                      <details>
                        <summary className="cursor-pointer underline">
                          Delete
                        </summary>
                        <button
                          className="mt-2 rounded bg-red-700 px-3 py-2 text-white"
                          type="submit"
                        >
                          Confirm delete
                        </button>
                      </details>
                    </form>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination
        basePath="/books"
        currentParams={{ q: params.q, category: params.category }}
        pageInfo={pageInfo}
        total={count ?? 0}
      />
    </div>
  );
}
