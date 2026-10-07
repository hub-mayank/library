'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <button
        className="mt-6 rounded bg-blue-700 px-4 py-2 text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
