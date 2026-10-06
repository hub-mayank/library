'use client';

import { useState } from 'react';

import { getCoverUrl } from '@/lib/covers';

export function BookCover({
  isbn,
  title,
  small = false,
}: {
  isbn: string;
  title: string;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';
  const url = getCoverUrl(isbn, small ? 'S' : 'M');
  const dimensions = small ? 'h-20 w-14' : 'h-48 w-32';
  if (!url || failed) {
    return (
      <div
        className={`${dimensions} flex shrink-0 flex-col items-center justify-center rounded bg-slate-200 p-2 text-center`}
      >
        <span className="text-lg font-bold">{initials}</span>
        <span className="text-xs">No cover found</span>
      </div>
    );
  }
  return (
    // External CDN URLs need no Next image optimizer and must fall back on load failure.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Cover of ${title}`}
      className={`${dimensions} shrink-0 rounded object-cover`}
      loading="lazy"
      width={small ? 56 : 128}
      height={small ? 80 : 192}
      onError={() => setFailed(true)}
    />
  );
}
