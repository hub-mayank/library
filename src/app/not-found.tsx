import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link className="mt-6 inline-block underline" href="/">
        Return home
      </Link>
    </main>
  );
}
