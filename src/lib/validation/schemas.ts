import { z } from 'zod';

import { CATEGORIES } from '@/config/categories';
import { normalizeIsbn, validateIsbn } from '@/lib/rules/isbn';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const bookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  isbn: z
    .string()
    .transform(normalizeIsbn)
    .refine((value) => validateIsbn(value).ok, 'Enter a valid ISBN.'),
  category: z.enum(CATEGORIES),
  totalCopies: z.number().int().min(1).max(1000),
});

export const idSchema = z.string().uuid();
