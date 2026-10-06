export type PageInfo = {
  totalPages: number;
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export const buildPageHref = (
  basePath: string,
  currentParams: URLSearchParams | Readonly<Record<string, string | undefined>>,
  page: number,
): string => {
  const params =
    currentParams instanceof URLSearchParams
      ? new URLSearchParams(currentParams)
      : new URLSearchParams(
          Object.entries(currentParams).filter(
            (entry): entry is [string, string] => entry[1] !== undefined,
          ),
        );
  if (page <= 1) params.delete('page');
  else params.set('page', String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const getPageInfo = (
  total: number,
  page: number,
  pageSize: number,
): PageInfo => {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('pageSize must be a positive integer');
  }
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const currentPage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  return {
    totalPages,
    page: currentPage,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
};
