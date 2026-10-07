import { fail, ok, Result } from './result';

export const normalizeIsbn = (raw: string): string =>
  raw.replace(/[\s-]/g, '').toUpperCase();

export const validateIsbn = (raw: string): Result<string, 'invalid_isbn'> => {
  const normalized = normalizeIsbn(raw);

  return /^(\d{9}[\dX]|\d{13})$/.test(normalized)
    ? ok(normalized)
    : fail('invalid_isbn');
};
