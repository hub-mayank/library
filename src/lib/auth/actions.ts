'use server';

import { redirect } from 'next/navigation';

import { getCurrentUser } from './session';
import { safeRedirectPath } from './guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const parseForm = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );

export async function register(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) {
    return {
      fieldErrors: { email: ['An account with this email may already exist.'] },
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError)
    return { error: 'Your account was created. Please sign in.' };
  redirect('/books');
}

export async function login(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { error: 'Invalid email or password' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Invalid email or password' };

  const user = await getCurrentUser();
  const next = safeRedirectPath(String(formData.get('next') ?? ''), '');
  if (next) redirect(next);
  redirect(user?.role === 'librarian' ? '/dashboard' : '/books');
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
