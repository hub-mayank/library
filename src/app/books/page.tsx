import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Pagination } from '@/components/Pagination';
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
import { getPageInfo } from '@/lib/query/pagination';
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
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    redirect(`/books${query.toString() ? `?${query}` : ''}`);
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Books</h1>
        {user.role === 'librarian' ? (
          <Link
            className="rounded bg-blue-700 px-4 py-2 text-white"
            href="/books/new"
          >
            Add book
          </Link>
        ) : (
          <span>
            {activeCount ?? 0} of {MAX_ACTIVE_LOANS} active loans
          </span>
        )}
      </div>
      {params.message ? (
        <p className="my-4 rounded border p-3" role="status">
          {params.message}
        </p>
      ) : null}
      <form className="my-6 flex flex-wrap gap-3" method="get">
        <input
          className="rounded border px-3 py-2"
          name="q"
          defaultValue={params.q}
          placeholder="Search title or author"
        />
        <select
          className="rounded border px-3 py-2"
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
        <button className="rounded border px-4 py-2" type="submit">
          Search
        </button>
        <Link className="px-4 py-2 underline" href="/books">
          Clear
        </Link>
      </form>
      {!books?.length ? (
        <p className="rounded border p-6">No books found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <article className="rounded border p-4" key={book.id}>
              <h2 className="text-xl font-semibold">{book.title}</h2>
              <p>{book.author}</p>
              <p className="mt-2 text-sm">
                {book.category} · ISBN {book.isbn}
              </p>
              <p className="mt-2">
                {book.available_copies} / {book.total_copies} available
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {user.role === 'member' ? (
                  <form action={requestBook}>
                    <input type="hidden" name="bookId" value={book.id} />
                    <button
                      disabled={book.available_copies === 0}
                      className="rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50"
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
