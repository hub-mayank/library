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
    <main className="flex flex-1 items-center bg-[radial-gradient(circle_at_top_right,_#d7f1e2,_transparent_42%)] px-4 py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-xl shadow-emerald-950/10 md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-emerald-950 p-10 text-white md:block">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-emerald-950">
            CL
          </div>
          <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Welcome back
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Your next good book is waiting.
          </h1>
          <p className="mt-5 leading-7 text-emerald-100">
            Sign in to request books, track returns, and keep your reading life
            moving.
          </p>
        </div>
        <div className="p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 md:hidden">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">
            Continue where your next good book begins.
          </p>
          <div className="mt-7">
            <AuthForm action={login} next={next} />
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Need an account?{' '}
            <Link
              className="font-semibold text-emerald-800 hover:underline"
              href="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
