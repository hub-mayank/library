import { createHash } from 'node:crypto';

export const getClientIp = (forwardedFor: string | null | undefined): string =>
  forwardedFor?.split(',')[0]?.trim() || 'unknown';

export const hashEmail = (email: string): string =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export const loginKey = (ip: string, email: string): string =>
  `login:${ip}:${hashEmail(email)}`;

export const ipKey = (action: string, ip: string): string => `${action}:${ip}`;

export const userKey = (action: string, userId: string): string =>
  `${action}:user:${userId}`;

export const mapRateLimitResult = (
  data: unknown,
): { ok: true } | { ok: false; retryAfter: number } => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'ok' in data &&
    data.ok === false &&
    'retry_after' in data &&
    typeof data.retry_after === 'number'
  ) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil(data.retry_after)) };
  }
  return { ok: true };
};
