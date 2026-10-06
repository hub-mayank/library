import 'server-only';

import { z } from 'zod';

const requiredEnvValue = z.string().trim().min(1);

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvValue.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvValue,
  SUPABASE_SERVICE_ROLE_KEY: requiredEnvValue,
  RESEND_API_KEY: requiredEnvValue,
  CRON_SECRET: requiredEnvValue,
});

const formatMissingVariables = (issues: z.ZodError): string => {
  const missingVariables = issues.issues.map((issue) => issue.path.join('.'));

  return `Missing or invalid environment variables: ${missingVariables.join(', ')}`;
};

export const validateServerEnv = (
  values: Record<string, string | undefined> = process.env,
) => {
  const result = serverEnvSchema.safeParse(values);

  if (!result.success) {
    throw new Error(formatMissingVariables(result.error));
  }

  return result.data;
};
