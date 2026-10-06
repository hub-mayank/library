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
    <Link href={buildPageHref(basePath, currentParams, pageInfo.page - 1)}>
      Previous
    </Link>
  ) : (
    <span aria-disabled="true">Previous</span>
  );
  const next = pageInfo.hasNext ? (
    <Link href={buildPageHref(basePath, currentParams, pageInfo.page + 1)}>
      Next
    </Link>
  ) : (
    <span aria-disabled="true">Next</span>
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center gap-4 text-sm"
    >
      {previous}
      <span aria-current="page">
        Page {pageInfo.page} of {pageInfo.totalPages}
      </span>
      {next}
      <span>{total} results</span>
    </nav>
  );
}
