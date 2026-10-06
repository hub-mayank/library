import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/config/categories';
import {
  bookSchema,
  idSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validation/schemas';

describe('validation schemas', () => {
  it('normalizes registration input', () => {
    expect(
      registerSchema.parse({
        name: '  Ada  ',
        email: 'ADA@EXAMPLE.COM',
        password: 'secret1',
      }),
    ).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'secret1' });
  });

  it('validates login credentials', () => {
    expect(() => loginSchema.parse({ email: '', password: '' })).toThrow();
  });

  it('normalizes ISBN and validates books', () => {
    const result = bookSchema.parse({
      title: '  Book ',
      author: ' Author ',
      isbn: '978-0-13-235088-4',
      category: CATEGORIES[0],
      totalCopies: 2,
    });
    expect(result.isbn).toBe('9780132350884');
    expect(result.title).toBe('Book');
  });

  it('validates UUIDs', () => {
    expect(idSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});
