import { describe, expect, it } from 'vitest';

import { getCoverUrl } from '@/lib/covers';

describe('getCoverUrl', () => {
  it('supports ISBN-10 and ISBN-13', () => {
    expect(getCoverUrl('0306406152')).toBe(
      'https://covers.openlibrary.org/b/isbn/0306406152-M.jpg?default=false',
    );
    expect(getCoverUrl('9780306406157', 'L')).toContain('/9780306406157-L.jpg');
  });

  it('normalizes dashes and rejects invalid ISBNs', () => {
    expect(getCoverUrl('978-0-306-40615-7')).toContain('/9780306406157-M.jpg');
    expect(getCoverUrl('not-an-isbn')).toBeNull();
  });
});
