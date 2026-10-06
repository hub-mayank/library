import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { mapRateLimitResult } from './keys';

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
  failOpen?: boolean;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number; infrastructureError?: boolean };

export const enforceRateLimit = async (
  supabaseAdmin: Pick<SupabaseClient, 'rpc'>,
  config: RateLimitConfig,
): Promise<RateLimitResult> => {
  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: config.key,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds,
  });
  if (error) {
    if (config.failOpen) return { ok: true };
    return { ok: false, retryAfter: 60, infrastructureError: true };
  }
  return mapRateLimitResult(data);
};
