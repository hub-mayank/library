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
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-xl font-bold">
              Community Library
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-4 text-sm"
            >
              {user ? (
                <>
                  {user.role === 'member' ? (
                    <>
                      <Link href="/books">Books</Link>
                      <Link href="/my-books">My books</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard">Dashboard</Link>
                      <Link href="/books">Books</Link>
                      <Link href="/issues">Issues</Link>
                    </>
                  )}
                  <span className="rounded-full border px-2 py-1">
                    {user.name} · {user.role}
                  </span>
                  <form action={logout}>
                    <button className="underline" type="submit">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link href="/register">Register</Link>
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
