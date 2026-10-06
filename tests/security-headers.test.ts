import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy } from '@/config/security-headers';

describe('content security policy', () => {
  it('includes required sources and only enables eval outside production', () => {
    const development = buildContentSecurityPolicy(
      'https://demo.supabase.co',
      false,
    );
    const production = buildContentSecurityPolicy(
      'https://demo.supabase.co',
      true,
    );
    expect(development).toContain(
      "connect-src 'self' https://demo.supabase.co",
    );
    expect(development).toContain('https://*.archive.org');
    expect(development).toContain("'unsafe-eval'");
    expect(production).not.toContain("'unsafe-eval'");
    expect(production).toContain("frame-ancestors 'none'");
  });
});
