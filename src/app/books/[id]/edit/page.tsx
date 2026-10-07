import { notFound } from 'next/navigation';

import { BookForm } from '../../new/page';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('librarian', '/books');
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!book) notFound();
  return <BookForm title="Edit book" book={book} />;
}
