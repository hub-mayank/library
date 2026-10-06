'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/db/admin';
import {
  approveLoan,
  markFinePaid,
  rejectLoan,
  returnLoan,
} from '@/lib/db/loans';
import { rpcFailureMessage } from '@/lib/actions/messages';
import { idSchema } from '@/lib/validation/schemas';

const loanId = (formData: FormData): string => {
  const parsed = idSchema.safeParse(formData.get('loanId'));
  if (!parsed.success) redirect('/issues?message=Invalid+loan');
  return parsed.data;
};

const finish = (
  result: { ok: true } | { ok: false; reason: keyof typeof rpcFailureMessage },
) => {
  if (!result.ok)
    redirect(
      `/issues?message=${encodeURIComponent(rpcFailureMessage[result.reason])}`,
    );
  revalidatePath('/issues');
  redirect('/issues?message=Loan+updated');
};

export async function approve(formData: FormData) {
  await requireRole('librarian', '/issues');
  finish(await approveLoan(getAdminClient(), loanId(formData)));
}

export async function reject(formData: FormData) {
  await requireRole('librarian', '/issues');
  finish(await rejectLoan(getAdminClient(), loanId(formData)));
}

export async function returnBook(formData: FormData) {
  await requireRole('librarian', '/issues');
  finish(await returnLoan(getAdminClient(), loanId(formData)));
}

export async function payFine(formData: FormData) {
  await requireRole('librarian', '/issues');
  finish(await markFinePaid(getAdminClient(), loanId(formData)));
}
