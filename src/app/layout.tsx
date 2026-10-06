import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import Link from 'next/link';

import { logout } from '@/lib/auth/actions';
import { getCurrentUser } from '@/lib/auth/session';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Community Library',
  description: 'Borrow, manage, and return books.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:p-3"
        >
          Skip to content
        </a>
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-lg font-bold text-white shadow-sm">
                CL
              </span>
              <span>
                <span className="block text-lg font-bold tracking-tight">
                  Community Library
                </span>
                <span className="hidden text-xs text-slate-500 sm:block">
                  Borrow better. Read more.
                </span>
              </span>
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              {user ? (
                <>
                  {user.role === 'member' ? (
                    <>
                      <Link
                        className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800"
                        href="/books"
                      >
                        Books
                      </Link>
                      <Link
                        className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800"
                        href="/my-books"
                      >
                        My books
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800"
                        href="/dashboard"
                      >
                        Dashboard
                      </Link>
                      <Link
                        className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800"
                        href="/books"
                      >
                        Books
                      </Link>
                      <Link
                        className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800"
                        href="/issues"
                      >
                        Issues
                      </Link>
                    </>
                  )}
                  <span className="ml-1 rounded-full border bg-white px-3 py-2 text-xs text-slate-600">
                    {user.name} · {user.role}
                  </span>
                  <form action={logout}>
                    <button
                      className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      type="submit"
                    >
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                    href="/login"
                  >
                    Log in
                  </Link>
                  <Link
                    className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-900"
                    href="/register"
                  >
                    Get started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main id="content" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
