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
import { enforceRateLimit } from '@/lib/rate-limit';
import { userKey } from '@/lib/rate-limit/keys';
import { RATE_LIMITS } from '@/config/rate-limits';

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
  const user = await requireRole('librarian', '/issues');
  await checkWriteLimit(user.id);
  finish(await approveLoan(getAdminClient(), loanId(formData)));
}

export async function reject(formData: FormData) {
  const user = await requireRole('librarian', '/issues');
  await checkWriteLimit(user.id);
  finish(await rejectLoan(getAdminClient(), loanId(formData)));
}

export async function returnBook(formData: FormData) {
  const user = await requireRole('librarian', '/issues');
  await checkWriteLimit(user.id);
  finish(await returnLoan(getAdminClient(), loanId(formData)));
}

export async function payFine(formData: FormData) {
  const user = await requireRole('librarian', '/issues');
  await checkWriteLimit(user.id);
  finish(await markFinePaid(getAdminClient(), loanId(formData)));
}

async function checkWriteLimit(userId: string) {
  const limited = await enforceRateLimit(getAdminClient(), {
    key: userKey('admin-write', userId),
    ...RATE_LIMITS.ADMIN_WRITE,
    failOpen: true,
  });
  if (!limited.ok)
    redirect(
      `/issues?message=${encodeURIComponent(`Too many attempts. Try again in ${Math.ceil(limited.retryAfter / 60)} minutes.`)}`,
    );
}
