import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  FINE_PER_DAY_INR,
  LOAN_DAYS,
  MAX_ACTIVE_LOANS,
} from '@/config/library-rules';
import { getCurrentUser } from '@/lib/auth/session';
import { defaultRouteForRole } from '@/lib/auth/guards';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(defaultRouteForRole(user.role));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <section className="grid items-center gap-10 overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 text-white shadow-xl shadow-emerald-950/10 sm:px-12 sm:py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Your neighborhood, in every chapter
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            A library that works for everyone.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-100">
            Browse the catalogue, request books, and keep every loan in one
            place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-white px-5 py-3 font-semibold text-emerald-950 shadow-sm hover:bg-emerald-50"
              href="/register"
            >
              Create your account
            </Link>
            <Link
              className="rounded-xl border border-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-900"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="hidden justify-center md:flex">
          <div className="relative h-64 w-52 rotate-3 rounded-r-2xl rounded-l-md bg-amber-100 p-5 text-emerald-950 shadow-2xl">
            <div className="h-full border border-emerald-950/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest">
                Read well
              </p>
              <p className="mt-16 text-3xl font-bold leading-tight">
                Stories worth sharing.
              </p>
              <p className="mt-4 text-xs">Community Library · Since today</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Browse freely', 'Find your next favorite from the catalogue.'],
          ['Borrow simply', 'Request available books in a few clicks.'],
          ['Stay on track', 'See loans, history, and fines at a glance.'],
        ].map(([title, description]) => (
          <div
            className="rounded-2xl border bg-white p-5 shadow-sm"
            key={title}
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        ))}
      </section>
      <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Good to know
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Library rules</h2>
        <ul className="mt-5 grid gap-3 text-slate-600 sm:grid-cols-3">
          <li>Members may hold up to {MAX_ACTIVE_LOANS} active loans.</li>
          <li>Loans last {LOAN_DAYS} calendar days.</li>
          <li>Late returns cost ₹{FINE_PER_DAY_INR} per day.</li>
        </ul>
      </section>
      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? (
        <p className="mt-6 rounded border border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
          Demo mode: member@demo.library.test / LibraryDemo123!
        </p>
      ) : null}
    </div>
  );
}
