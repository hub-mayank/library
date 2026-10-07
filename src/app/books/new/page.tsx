import { requireRole } from '@/lib/auth/session';
import { CATEGORIES } from '@/config/categories';
import { saveBook } from '../actions';

export default async function NewBookPage() {
  await requireRole('librarian', '/books/new');
  return <BookForm title="Add book" />;
}

export function BookForm({
  title,
  book,
}: {
  title: string;
  book?: Record<string, unknown>;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Catalogue management
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-slate-600">
          Keep the catalogue accurate so every reader can find their next book.
        </p>
      </div>
      <form
        action={saveBook}
        className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
      >
        {book?.id ? (
          <input type="hidden" name="bookId" value={String(book.id)} />
        ) : null}
        {(['title', 'author', 'isbn'] as const).map((field) => (
          <label className="block" key={field}>
            <span className="mb-1 block font-medium">
              {field[0].toUpperCase() + field.slice(1)}
            </span>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2.5 shadow-sm"
              name={field}
              defaultValue={String(book?.[field] ?? '')}
              required
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block font-medium">Category</span>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2.5 shadow-sm"
            name="category"
            defaultValue={String(book?.category ?? '')}
            required
          >
            <option value="">Choose a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">Total copies</span>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2.5 shadow-sm"
            name="totalCopies"
            type="number"
            min={1}
            max={1000}
            defaultValue={String(book?.total_copies ?? 1)}
            required
          />
        </label>
        <button
          className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-900"
          type="submit"
        >
          Save book
        </button>
      </form>
    </div>
  );
}
