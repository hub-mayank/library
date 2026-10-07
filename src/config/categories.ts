export const CATEGORIES = [
  'Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Self Help',
  'Children',
] as const;

export type Category = (typeof CATEGORIES)[number];
