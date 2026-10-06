export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowSeconds: 15 * 60 },
  REGISTER: { limit: 5, windowSeconds: 60 * 60 },
  REQUEST_LOAN: { limit: 10, windowSeconds: 10 * 60 },
  ADMIN_WRITE: { limit: 60, windowSeconds: 10 * 60 },
  DELETE_BOOK: { limit: 10, windowSeconds: 10 * 60 },
} as const;
