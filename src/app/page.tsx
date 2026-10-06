import { redirect } from 'next/navigation';

import {
  FINE_PER_DAY_INR,
  LOAN_DAYS,
  MAX_ACTIVE_LOANS,
} from '@/config/library-rules';
import { getCurrentUser } from '@/lib/auth/session';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'librarian' ? '/dashboard' : '/my-books');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold">A library that works for everyone.</h1>
      <p className="mt-4 max-w-2xl text-lg">
        Browse the catalogue, request books, and keep every loan in one place.
      </p>
      <section className="mt-10 rounded border p-6">
        <h2 className="text-2xl font-semibold">Library rules</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5">
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
