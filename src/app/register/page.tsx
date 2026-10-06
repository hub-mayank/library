import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { register } from '@/lib/auth/actions';
import { getCurrentUser } from '@/lib/auth/session';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Create an account</h1>
      <AuthForm action={register} register />
      <p className="mt-6 text-sm">
        Already registered?{' '}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
