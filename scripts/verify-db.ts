import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { FINE_PER_DAY_INR, MAX_ACTIVE_LOANS } from '@/config/library-rules';
import { toCalendarDate } from '@/lib/rules/dates';

import { seedDemoData } from './seed';

const MEMBER_EMAIL = 'member@demo.library.test';
const MEMBER_PASSWORD = 'LibraryDemo123!';
const LIBRARIAN_EMAIL = 'librarian@demo.library.test';
const LIBRARIAN_PASSWORD = 'LibraryDemo123!';

const loadEnv = (): void => {
  if (typeof process.loadEnvFile !== 'function') {
    throw new Error(
      'This script requires Node.js process.loadEnvFile support.',
    );
  }
  process.loadEnvFile('.env.local');
};

const getClient = (
  keyName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY',
) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env[keyName];
  if (!url || !key)
    throw new Error(`${keyName} and NEXT_PUBLIC_SUPABASE_URL are required.`);
  return createClient(url, key, { auth: { persistSession: false } });
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const check = async (
  name: string,
  operation: () => Promise<boolean>,
): Promise<void> => {
  try {
    assert(await operation(), 'condition was false');
    console.log(`PASS ${name}`);
  } catch (error) {
    console.log(
      `FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};

const signIn = async (
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> => {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

const rpc = async (
  client: SupabaseClient,
  name: string,
  params: Record<string, unknown>,
): Promise<{
  data: { ok: boolean; id?: string; reason?: string } | null;
  error: Error | null;
}> => {
  const response = await client.rpc(name, params);
  return {
    data: response.data as { ok: boolean; id?: string; reason?: string } | null,
    error: response.error ? new Error(response.error.message) : null,
  };
};

const requireRpcId = (
  result: Awaited<ReturnType<typeof rpc>>,
  message: string,
): string => {
  if (!result.data?.ok || !result.data.id) throw new Error(message);
  return result.data.id;
};

const createTemporaryMember = async (
  admin: SupabaseClient,
): Promise<{ id: string; email: string }> => {
  const email = `verify-${Date.now()}@demo.library.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: MEMBER_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Verification Member' },
  });
  if (error || !data.user)
    throw error ?? new Error('Could not create verification member');
  return { id: data.user.id, email };
};

export const verifyDatabase = async (): Promise<void> => {
  const anon = getClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const admin = getClient('SUPABASE_SERVICE_ROLE_KEY');
  const member = getClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const librarian = getClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  await check('anon cannot read books', async () => {
    const { error } = await anon.from('books').select('id');
    return Boolean(error);
  });
  await check('anon cannot read loans', async () => {
    const { error } = await anon.from('loans').select('id');
    return Boolean(error);
  });
  await check('anon cannot read profiles', async () => {
    const { error } = await anon.from('profiles').select('id');
    return Boolean(error);
  });

  await signIn(member, MEMBER_EMAIL, MEMBER_PASSWORD);
  await signIn(librarian, LIBRARIAN_EMAIL, LIBRARIAN_PASSWORD);

  const { data: memberUser } = await member.auth.getUser();
  const memberId = memberUser.user?.id;
  if (!memberId) throw new Error('Member sign-in returned no user');

  await check('member can read books', async () => {
    const { data, error } = await member.from('books').select('id');
    return !error && Boolean(data);
  });
  await check('member can read only their loans', async () => {
    const { data, error } = await member.from('loans').select('member_id');
    return (
      !error && data?.every((loan) => loan.member_id === memberId) === true
    );
  });
  await check('member can read only their profile', async () => {
    const { data, error } = await member.from('profiles').select('id');
    return !error && data?.every((profile) => profile.id === memberId) === true;
  });
  await check('member cannot write books', async () => {
    const { error } = await member.from('books').insert({
      title: 'Forbidden',
      author: 'Verification',
      isbn: '9780000000002',
      category: 'Fiction',
      total_copies: 1,
      available_copies: 1,
    });
    return Boolean(error);
  });
  await check('member cannot write loans', async () => {
    const { error } = await member
      .from('loans')
      .delete()
      .eq('member_id', memberId);
    return Boolean(error);
  });
  await check('member cannot promote their role', async () => {
    const { error } = await member
      .from('profiles')
      .update({ role: 'librarian' })
      .eq('id', memberId);
    return Boolean(error);
  });
  await check('member cannot call RPC functions', async () => {
    const { error } = await rpc(member, 'delete_book', {
      p_book: '00000000-0000-0000-0000-000000000000',
    });
    return Boolean(error);
  });
  await check('librarian can read all loans and profiles', async () => {
    const [loans, profiles] = await Promise.all([
      librarian.from('loans').select('id'),
      librarian.from('profiles').select('id'),
    ]);
    return !loans.error && !profiles.error;
  });

  const temporary = await createTemporaryMember(admin);
  try {
    const { data: books, error: booksError } = await admin
      .from('books')
      .select('id,available_copies')
      .order('isbn')
      .limit(12);
    if (booksError || !books || books.length < 10)
      throw booksError ?? new Error('Not enough books');

    const first = await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[0].id,
      p_max_loans: MAX_ACTIVE_LOANS,
    });
    assert(first.data?.ok === true, 'first request did not succeed');
    const duplicate = await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[0].id,
      p_max_loans: MAX_ACTIVE_LOANS,
    });
    assert(
      duplicate.data?.reason === 'duplicate_request',
      'duplicate request reason mismatch',
    );

    await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[1].id,
      p_max_loans: MAX_ACTIVE_LOANS,
    });
    await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[2].id,
      p_max_loans: MAX_ACTIVE_LOANS,
    });
    const fourth = await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[3].id,
      p_max_loans: MAX_ACTIVE_LOANS,
    });
    assert(
      fourth.data?.reason === 'loan_limit_reached',
      'loan limit reason mismatch',
    );
    console.log('PASS service-role duplicate and loan-limit checks');

    const zeroCopyLoan = await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[4].id,
      p_max_loans: 10,
    });
    const zeroCopyLoanId = requireRpcId(
      zeroCopyLoan,
      'zero-copy setup request failed',
    );
    const { error: zeroCopyError } = await admin
      .from('books')
      .update({ available_copies: 0 })
      .eq('id', books[4].id);
    if (zeroCopyError) throw zeroCopyError;
    const noCopies = await rpc(admin, 'approve_loan', {
      p_loan: zeroCopyLoanId,
      p_loan_days: 14,
      p_today: toCalendarDate(new Date()),
    });
    assert(
      noCopies.data?.reason === 'no_copies_available',
      'no-copies reason mismatch',
    );
    console.log('PASS service-role no-copies check');

    const returnLoan = await rpc(admin, 'request_loan', {
      p_member: temporary.id,
      p_book: books[5].id,
      p_max_loans: 10,
    });
    const returnLoanId = requireRpcId(
      returnLoan,
      'return setup request failed',
    );
    const approved = await rpc(admin, 'approve_loan', {
      p_loan: returnLoanId,
      p_loan_days: 14,
      p_today: toCalendarDate(new Date()),
    });
    assert(approved.data?.ok === true, 'return setup approval failed');
    const returned = await rpc(admin, 'return_loan', {
      p_loan: returnLoanId,
      p_fine_per_day: FINE_PER_DAY_INR,
      p_today: toCalendarDate(new Date()),
    });
    assert(returned.data?.ok === true, 'return failed');
    const returnedTwice = await rpc(admin, 'return_loan', {
      p_loan: returnLoanId,
      p_fine_per_day: FINE_PER_DAY_INR,
      p_today: toCalendarDate(new Date()),
    });
    assert(
      returnedTwice.data?.reason === 'invalid_status',
      'second return reason mismatch',
    );
    console.log('PASS service-role repeated-return check');

    const { data: overdue, error: overdueError } = await admin
      .from('loans')
      .select('id')
      .eq('member_id', memberId)
      .eq('status', 'issued')
      .lt('due_date', toCalendarDate(new Date()))
      .limit(1)
      .maybeSingle();
    if (overdueError || !overdue)
      throw overdueError ?? new Error('Seed overdue loan missing');
    const returnedOverdue = await rpc(admin, 'return_loan', {
      p_loan: overdue.id,
      p_fine_per_day: FINE_PER_DAY_INR,
      p_today: toCalendarDate(new Date()),
    });
    const { data: overdueLoan } = await admin
      .from('loans')
      .select('fine')
      .eq('id', overdue.id)
      .single();
    assert(
      returnedOverdue.data?.ok === true &&
        overdueLoan?.fine === 6 * FINE_PER_DAY_INR,
      'overdue fine mismatch',
    );
    console.log('PASS service-role overdue fine check');

    const concurrent = await Promise.all(
      books.slice(6).map((book) =>
        rpc(admin, 'request_loan', {
          p_member: temporary.id,
          p_book: book.id,
          p_max_loans: MAX_ACTIVE_LOANS,
        }),
      ),
    );
    assert(
      concurrent.filter((result) => result.data?.ok).length <= MAX_ACTIVE_LOANS,
      'concurrency exceeded loan cap',
    );
    console.log('PASS concurrent request loan limit check');
  } finally {
    await admin.from('loans').delete().eq('member_id', temporary.id);
    await admin.auth.admin.deleteUser(temporary.id);
    await seedDemoData();
  }
};

loadEnv();
verifyDatabase().catch(() => {
  process.exitCode = 1;
});
