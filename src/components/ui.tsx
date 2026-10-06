import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded bg-blue-700 px-4 py-2 font-medium text-white focus:outline-2 focus:outline-offset-2 focus:outline-blue-700 disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border px-2 py-1 text-sm">{children}</span>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded border border-amber-500 bg-amber-50 p-3 text-amber-950"
      role="status"
    >
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded border p-6 text-center">{children}</p>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Pagination({ page, pages }: { page: number; pages: number }) {
  return pages > 1 ? (
    <p className="text-sm">
      Page {page} of {pages}
    </p>
  ) : null;
}
