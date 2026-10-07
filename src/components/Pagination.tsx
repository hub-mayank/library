import Link from 'next/link';

import { buildPageHref, type PageInfo } from '@/lib/query/pagination';

export function Pagination({
  basePath,
  currentParams,
  pageInfo,
  total,
}: {
  basePath: string;
  currentParams: URLSearchParams | Readonly<Record<string, string | undefined>>;
  pageInfo: PageInfo;
  total: number;
}) {
  const previous = pageInfo.hasPrev ? (
    <Link
      className="rounded-lg border bg-white px-3 py-2 font-medium hover:border-emerald-300 hover:bg-emerald-50"
      href={buildPageHref(basePath, currentParams, pageInfo.page - 1)}
    >
      ← Previous
    </Link>
  ) : (
    <span
      className="rounded-lg border px-3 py-2 text-slate-400"
      aria-disabled="true"
    >
      ← Previous
    </span>
  );
  const next = pageInfo.hasNext ? (
    <Link
      className="rounded-lg border bg-white px-3 py-2 font-medium hover:border-emerald-300 hover:bg-emerald-50"
      href={buildPageHref(basePath, currentParams, pageInfo.page + 1)}
    >
      Next →
    </Link>
  ) : (
    <span
      className="rounded-lg border px-3 py-2 text-slate-400"
      aria-disabled="true"
    >
      Next →
    </span>
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm"
    >
      <div className="flex items-center gap-2">
        {previous}
        {next}
      </div>
      <span
        className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-900"
        aria-current="page"
      >
        Page {pageInfo.page} of {pageInfo.totalPages}
      </span>
      <span className="text-slate-500">
        {total} result{total === 1 ? '' : 's'}
      </span>
    </nav>
  );
}
