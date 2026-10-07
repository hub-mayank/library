import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { register } from '@/lib/auth/actions';
import { getCurrentUser } from '@/lib/auth/session';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="flex flex-1 items-center bg-[radial-gradient(circle_at_top_left,_#d7f1e2,_transparent_42%)] px-4 py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-xl shadow-emerald-950/10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Join the library
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            A simpler way to keep your reading life moving.
          </p>
          <div className="mt-7">
            <AuthForm action={register} register />
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Already registered?{' '}
            <Link
              className="font-semibold text-emerald-800 hover:underline"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="hidden bg-amber-100 p-10 text-emerald-950 md:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Make room for stories
          </p>
          <p className="mt-6 text-4xl font-bold leading-tight">
            Borrow with purpose. Return with a story.
          </p>
          <div className="mt-10 space-y-4 text-sm leading-6 text-emerald-900">
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              Browse a community catalogue built for curious readers.
            </p>
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              Keep requests, due dates, and reading history in one place.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
