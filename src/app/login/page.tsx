import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { login } from '@/lib/auth/actions';
import { getCurrentUser } from '@/lib/auth/session';
import { safeRedirectPath } from '@/lib/auth/guards';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) redirect('/');
  const params = await searchParams;
  const next = safeRedirectPath(params.next, '');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <div className="w-full rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Continue where your next good book begins.
        </p>
        <div className="mt-7">
          <AuthForm action={login} next={next} />
        </div>
        <p className="mt-6 text-sm text-slate-600">
          Need an account?{' '}
          <Link className="underline" href="/register">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
