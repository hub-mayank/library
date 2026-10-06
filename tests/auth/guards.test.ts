import { describe, expect, it } from 'vitest';

import { decideAccess, safeRedirectPath } from '@/lib/auth/guards';

describe('auth guards', () => {
  it.each([
    [{ user: null, requiredRole: 'member' as const }, '/login'],
    [
      { user: { role: 'member' as const }, requiredRole: 'librarian' as const },
      '/',
    ],
    [
      { user: { role: 'librarian' as const }, requiredRole: 'member' as const },
      '/',
    ],
  ])('redirects denied access', (input, redirectTo) => {
    expect(decideAccess(input)).toEqual({ allow: false, redirectTo });
  });

  it.each([
    [{ user: { role: 'member' as const }, requiredRole: 'member' as const }],
    [
      {
        user: { role: 'librarian' as const },
        requiredRole: 'librarian' as const,
      },
    ],
  ])('allows matching roles', (input) => {
    expect(decideAccess(input)).toEqual({ allow: true });
  });
});

describe('safeRedirectPath', () => {
  it.each([
    '//evil.com',
    'https://evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    '',
    null,
    undefined,
  ])('rejects %s', (input) => {
    expect(safeRedirectPath(input)).toBe('/');
  });

  it('accepts same-site paths', () => {
    expect(safeRedirectPath('/books?page=2')).toBe('/books?page=2');
  });
});
