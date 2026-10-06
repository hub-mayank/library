import { describe, expect, it } from 'vitest';

import nextConfig from '../next.config';

describe('security headers', () => {
  it('sets the required headers without a content security policy', async () => {
    const rules = await nextConfig.headers?.();
    const headers = new Map(
      rules?.[0]?.headers?.map(({ key, value }) => [key, value]),
    );

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    expect(headers.has('Content-Security-Policy')).toBe(false);
  });
});
