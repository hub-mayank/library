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
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Sign in</h1>
      <AuthForm action={login} next={next} />
      <p className="mt-6 text-sm">
        Need an account?{' '}
        <Link className="underline" href="/register">
          Register
        </Link>
      </p>
    </main>
  );
}
