'use client';

import { useActionState } from 'react';

import type { AuthActionState } from '@/lib/auth/actions';

type Props = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  register?: boolean;
  next?: string;
};

export function AuthForm({ action, register = false, next }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {register ? (
        <label className="block">
          <span className="mb-1 block font-medium">Name</span>
          <input
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            aria-describedby={error('name') ? 'name-error' : undefined}
            className="w-full rounded border px-3 py-2"
          />
          {error('name') ? (
            <span id="name-error" className="text-sm text-red-700">
              {error('name')}
            </span>
          ) : null}
        </label>
      ) : null}
      <label className="block">
        <span className="mb-1 block font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-describedby={error('email') ? 'email-error' : undefined}
          className="w-full rounded border px-3 py-2"
        />
        {error('email') ? (
          <span id="email-error" className="text-sm text-red-700">
            {error('email')}
          </span>
        ) : null}
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          maxLength={72}
          autoComplete={register ? 'new-password' : 'current-password'}
          aria-describedby={error('password') ? 'password-error' : undefined}
          className="w-full rounded border px-3 py-2"
        />
        {error('password') ? (
          <span id="password-error" className="text-sm text-red-700">
            {error('password')}
          </span>
        ) : null}
      </label>
      {state.error ? (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Working…' : register ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}
