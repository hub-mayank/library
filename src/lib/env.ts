import { z } from 'zod';

const requiredEnvValue = z.string().trim().min(1);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvValue.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvValue,
  NEXT_PUBLIC_DEMO_MODE: z.enum(['true', 'false']).optional(),
});

const formatMissingVariables = (issues: z.ZodError): string => {
  const missingVariables = issues.issues.map((issue) => issue.path.join('.'));

  return `Missing or invalid environment variables: ${missingVariables.join(', ')}`;
};

export const validatePublicEnv = (
  values: Record<string, string | undefined> = process.env,
) => {
  const result = publicEnvSchema.safeParse(values);

  if (!result.success) {
    throw new Error(formatMissingVariables(result.error));
  }

  return result.data;
};
