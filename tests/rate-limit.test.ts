import { describe, expect, it, vi } from 'vitest';

import {
  getClientIp,
  hashEmail,
  loginKey,
  mapRateLimitResult,
} from '@/lib/rate-limit/keys';
import { enforceRateLimit } from '@/lib/rate-limit';

describe('rate-limit keys', () => {
  it('uses the first forwarded IP and hashes normalized email', () => {
    expect(getClientIp(' 1.2.3.4, 5.6.7.8')).toBe('1.2.3.4');
    expect(getClientIp(undefined)).toBe('unknown');
    expect(loginKey('1.2.3.4', ' User@Example.com ')).toContain(
      hashEmail('user@example.com'),
    );
    expect(loginKey('1.2.3.4', ' User@Example.com ')).not.toContain(
      'user@example.com',
    );
  });

  it('maps allowed and blocked database responses', () => {
    expect(mapRateLimitResult({ ok: true })).toEqual({ ok: true });
    expect(mapRateLimitResult({ ok: false, retry_after: 61.2 })).toEqual({
      ok: false,
      retryAfter: 62,
    });
  });
});

describe('enforceRateLimit', () => {
  it('fails open or closed according to the action policy', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('db') }),
    };
    await expect(
      enforceRateLimit(client, {
        key: 'read',
        limit: 1,
        windowSeconds: 1,
        failOpen: true,
      }),
    ).resolves.toEqual({ ok: true });
    await expect(
      enforceRateLimit(client, { key: 'login', limit: 1, windowSeconds: 1 }),
    ).resolves.toMatchObject({ ok: false });
  });
});
