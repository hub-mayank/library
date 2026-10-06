import { normalizeIsbn, validateIsbn } from '@/lib/rules/isbn';

export const getCoverUrl = (
  isbn: string,
  size: 'S' | 'M' | 'L' = 'M',
): string | null => {
  const normalized = normalizeIsbn(isbn);
  if (!validateIsbn(normalized).ok) return null;
  return `https://covers.openlibrary.org/b/isbn/${normalized}-${size}.jpg?default=false`;
};
