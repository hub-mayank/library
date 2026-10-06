import { describe, expect, it } from 'vitest';

import { validatePublicEnv } from '@/lib/env';
import { validateServerEnv } from '@/lib/env.server';

const validPublicEnv: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
};

const validServerEnv: Record<string, string> = {
  ...validPublicEnv,
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  RESEND_API_KEY: 'resend-key',
  CRON_SECRET: 'cron-secret',
};

describe('public environment validation', () => {
  it('passes with valid values', () => {
    expect(validatePublicEnv(validPublicEnv)).toEqual(validPublicEnv);
  });

  it('fails when the Supabase URL is missing', () => {
    const missingUrl = { ...validPublicEnv };
    delete missingUrl.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => validatePublicEnv(missingUrl)).toThrow(
      'NEXT_PUBLIC_SUPABASE_URL',
    );
  });

  it('fails when the Supabase URL is not a URL', () => {
    expect(() =>
      validatePublicEnv({
        ...validPublicEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
      }),
    ).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('fails when the anon key is missing', () => {
    const missingAnonKey = { ...validPublicEnv };
    delete missingAnonKey.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => validatePublicEnv(missingAnonKey)).toThrow(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  });
});

describe('server environment validation', () => {
  it('passes with valid values', () => {
    expect(validateServerEnv(validServerEnv)).toEqual(validServerEnv);
  });

  it.each(['SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'RESEND_API_KEY'])(
    'fails when %s is missing and names the variable',
    (variable) => {
      const missingVariable = { ...validServerEnv };
      delete missingVariable[variable];

      expect(() => validateServerEnv(missingVariable)).toThrow(variable);
    },
  );
});
