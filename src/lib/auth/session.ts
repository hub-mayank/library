import { redirect } from 'next/navigation';

import { decideAccess, safeRedirectPath, type GuardRole } from './guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: GuardRole;
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: data.user.id,
    email: data.user.email,
    name: profile.name,
    role: profile.role as GuardRole,
  };
};

export const requireUser = async (path = '/'): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user)
    redirect(`/login?next=${encodeURIComponent(safeRedirectPath(path, '/'))}`);
  return user;
};

export const requireRole = async (
  role: GuardRole,
  path = '/',
): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  const decision = decideAccess({ user, requiredRole: role });
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(safeRedirectPath(path, '/'))}`);
  }
  if (!decision.allow) {
    if (decision.redirectTo === '/login') {
      redirect(
        `/login?next=${encodeURIComponent(safeRedirectPath(path, '/'))}`,
      );
    }
    redirect('/');
  }
  return user;
};
