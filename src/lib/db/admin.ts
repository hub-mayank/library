import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { validateServerEnv } from '@/lib/env.server';

import type { RpcClient } from './types';

export const getAdminClient = (): RpcClient => {
  const env = validateServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
};
