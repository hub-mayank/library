import { describe, expect, it } from 'vitest';

import { normalizeIsbn, validateIsbn } from '@/lib/rules/isbn';

describe('ISBN rules', () => {
  it('normalizes spaces, dashes, and case', () => {
    expect(normalizeIsbn(' 0-306-40615-x ')).toBe('030640615X');
    expect(normalizeIsbn('978 0 306 40615 7')).toBe('9780306406157');
  });

  it.each([
    ['0-306-40615-2', '0306406152'],
    ['978 0 306 40615 7', '9780306406157'],
    ['0-306-40615-x', '030640615X'],
  ])('accepts %s', (raw, normalized) => {
    expect(validateIsbn(raw)).toEqual({ ok: true, value: normalized });
  });

  it.each([
    '030640615X1',
    '123456789',
    '12345678901',
    '123456789012',
    'abc',
    '',
  ])('rejects %s', (raw) => {
    expect(validateIsbn(raw)).toEqual({ ok: false, reason: 'invalid_isbn' });
  });
});
