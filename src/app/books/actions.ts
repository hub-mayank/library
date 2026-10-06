'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createBook, deleteBook, updateBookCopies } from '@/lib/db/books';
import { requestLoan, cancelLoan } from '@/lib/db/loans';
import { rpcFailureMessage } from '@/lib/actions/messages';
import { getAdminClient } from '@/lib/db/admin';
import { requireRole } from '@/lib/auth/session';
import { idSchema, bookSchema } from '@/lib/validation/schemas';

const formObject = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );

export async function requestBook(formData: FormData) {
  const user = await requireRole('member', '/books');
  const bookId = idSchema.safeParse(formData.get('bookId'));
  if (!bookId.success) redirect('/books?message=Invalid+book');
  const result = await requestLoan(getAdminClient(), user.id, bookId.data);
  revalidatePath('/books');
  if (!result.ok)
    redirect(
      `/books?message=${encodeURIComponent(rpcFailureMessage[result.reason])}`,
    );
  redirect('/books?message=Request+submitted');
}

export async function cancelBookLoan(formData: FormData) {
  const user = await requireRole('member', '/my-books');
  const loanId = idSchema.safeParse(formData.get('loanId'));
  if (!loanId.success) redirect('/my-books?message=Invalid+loan');
  const result = await cancelLoan(getAdminClient(), loanId.data, user.id);
  revalidatePath('/my-books');
  if (!result.ok)
    redirect(
      `/my-books?message=${encodeURIComponent(rpcFailureMessage[result.reason])}`,
    );
  redirect('/my-books?message=Loan+cancelled');
}

export async function saveBook(formData: FormData) {
  await requireRole('librarian', '/books');
  const parsed = bookSchema.safeParse({
    ...formObject(formData),
    totalCopies: Number(formData.get('totalCopies')),
  });
  if (!parsed.success) redirect('/books?message=Invalid+book+details');

  const client = getAdminClient();
  const bookId = formData.get('bookId');
  if (typeof bookId === 'string' && idSchema.safeParse(bookId).success) {
    const result = await updateBookCopies(
      client,
      bookId,
      parsed.data.totalCopies,
    );
    if (!result.ok)
      redirect(
        `/books?message=${encodeURIComponent(rpcFailureMessage[result.reason])}`,
      );
    const { error } = await client
      .from('books')
      .update({
        title: parsed.data.title,
        author: parsed.data.author,
        isbn: parsed.data.isbn,
        category: parsed.data.category,
      })
      .eq('id', bookId);
    if (error) redirect('/books?message=Could+not+update+book');
  } else {
    await createBook(client, {
      ...parsed.data,
      total_copies: parsed.data.totalCopies,
      available_copies: parsed.data.totalCopies,
    });
  }
  revalidatePath('/books');
  redirect('/books?message=Book+saved');
}

export async function removeBook(formData: FormData) {
  await requireRole('librarian', '/books');
  const bookId = idSchema.safeParse(formData.get('bookId'));
  if (!bookId.success) redirect('/books?message=Invalid+book');
  const result = await deleteBook(getAdminClient(), bookId.data);
  revalidatePath('/books');
  if (!result.ok)
    redirect(
      `/books?message=${encodeURIComponent(rpcFailureMessage[result.reason])}`,
    );
  redirect('/books?message=Book+deleted');
}
