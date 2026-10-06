import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { register } from '@/lib/auth/actions';
import { getCurrentUser } from '@/lib/auth/session';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <div className="w-full rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
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
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
