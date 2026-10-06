export type GuardRole = 'member' | 'librarian';

export type GuardUser = { role: GuardRole };

export type AccessDecision =
  { allow: true } | { allow: false; redirectTo: string };

export const decideAccess = ({
  user,
  requiredRole,
}: {
  user: GuardUser | null;
  requiredRole: GuardRole;
}): AccessDecision =>
  user === null
    ? { allow: false, redirectTo: '/login' }
    : user.role === requiredRole
      ? { allow: true }
      : { allow: false, redirectTo: '/' };

export const safeRedirectPath = (
  input: string | null | undefined,
  fallback = '/',
): string => {
  if (!input || !input.startsWith('/') || input.startsWith('//'))
    return fallback;
  if (input.startsWith('/\\') || input.includes('\\')) return fallback;
  return input;
};
