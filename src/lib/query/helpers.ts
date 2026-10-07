export const sanitizeSearchTerm = (raw: string): string =>
  raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[(),%_\\*]/g, '')
    .trim()
    .slice(0, 100);

export const parsePageParam = (raw: string | null | undefined): number => {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
};

export const getPageRange = (
  page: number,
  pageSize: number,
): { from: number; to: number } => ({
  from: (page - 1) * pageSize,
  to: page * pageSize - 1,
});
