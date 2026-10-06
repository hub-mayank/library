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
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      <form action={saveBook} className="space-y-4">
        {book?.id ? (
          <input type="hidden" name="bookId" value={String(book.id)} />
        ) : null}
        {(['title', 'author', 'isbn'] as const).map((field) => (
          <label className="block" key={field}>
            <span className="mb-1 block font-medium">
              {field[0].toUpperCase() + field.slice(1)}
            </span>
            <input
              className="w-full rounded border px-3 py-2"
              name={field}
              defaultValue={String(book?.[field] ?? '')}
              required
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block font-medium">Category</span>
          <select
            className="w-full rounded border px-3 py-2"
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
            className="w-full rounded border px-3 py-2"
            name="totalCopies"
            type="number"
            min={1}
            max={1000}
            defaultValue={String(book?.total_copies ?? 1)}
            required
          />
        </label>
        <button
          className="rounded bg-blue-700 px-4 py-2 text-white"
          type="submit"
        >
          Save book
        </button>
      </form>
    </div>
  );
}
