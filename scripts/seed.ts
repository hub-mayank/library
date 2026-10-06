import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { FINE_PER_DAY_INR } from '@/config/library-rules';
import { addDays, toCalendarDate } from '@/lib/rules/dates';

const DEMO_PASSWORD = 'LibraryDemo123!';
const DEMO_LIBRARIAN_EMAIL = 'librarian@demo.library.test';
const DEMO_MEMBER_EMAIL = 'member@demo.library.test';

type DemoBook = {
  title: string;
  author: string;
  isbn: string;
  category:
    | 'Fiction'
    | 'Science'
    | 'Technology'
    | 'History'
    | 'Biography'
    | 'Self Help'
    | 'Children';
  total_copies: number;
};

// DEMO DATA: these accounts and books are for local verification only.
const DEMO_BOOKS: DemoBook[] = [
  {
    title: 'Matilda',
    author: 'Roald Dahl',
    isbn: '9780140328721',
    category: 'Fiction',
    total_copies: 3,
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Fiction',
    total_copies: 4,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    category: 'Fiction',
    total_copies: 2,
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    category: 'Fiction',
    total_copies: 3,
  },
  {
    title: 'The Origin of Species',
    author: 'Charles Darwin',
    isbn: '9780451529060',
    category: 'Science',
    total_copies: 2,
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    category: 'Science',
    total_copies: 3,
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    isbn: '9780345539434',
    category: 'Science',
    total_copies: 2,
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Technology',
    total_copies: 5,
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '9781491950357',
    category: 'Technology',
    total_copies: 3,
  },
  {
    title: 'Effective Java',
    author: 'Joshua Bloch',
    isbn: '9780134685991',
    category: 'Technology',
    total_copies: 2,
  },
  {
    title: 'Spring in Action',
    author: 'Craig Walls',
    isbn: '9781617294945',
    category: 'Technology',
    total_copies: 2,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '9780062316097',
    category: 'History',
    total_copies: 4,
  },
  {
    title: '1491',
    author: 'Charles C. Mann',
    isbn: '9781400040151',
    category: 'History',
    total_copies: 2,
  },
  {
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    isbn: '9780393317558',
    category: 'History',
    total_copies: 3,
  },
  {
    title: 'A Little History of the World',
    author: 'E. H. Gombrich',
    isbn: '9780307783945',
    category: 'History',
    total_copies: 2,
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    isbn: '9781451648539',
    category: 'Biography',
    total_copies: 3,
  },
  {
    title: 'Becoming',
    author: 'Michelle Obama',
    isbn: '9781524763138',
    category: 'Biography',
    total_copies: 2,
  },
  {
    title: 'The Diary of a Young Girl',
    author: 'Anne Frank',
    isbn: '9780553296983',
    category: 'Biography',
    total_copies: 3,
  },
  {
    title: 'Long Walk to Freedom',
    author: 'Nelson Mandela',
    isbn: '9780316548182',
    category: 'Biography',
    total_copies: 2,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    category: 'Self Help',
    total_copies: 5,
  },
  {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    isbn: '9780743269513',
    category: 'Self Help',
    total_copies: 3,
  },
  {
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    isbn: '9780812981605',
    category: 'Self Help',
    total_copies: 2,
  },
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    isbn: '9780547928227',
    category: 'Children',
    total_copies: 4,
  },
  {
    title: 'Harry Potter and the Sorcerer’s Stone',
    author: 'J. K. Rowling',
    isbn: '9780590353427',
    category: 'Children',
    total_copies: 5,
  },
  {
    title: 'Charlotte’s Web',
    author: 'E. B. White',
    isbn: '9780064400558',
    category: 'Children',
    total_copies: 3,
  },
];

const assertIsbn13 = (book: DemoBook): void => {
  const digits = book.isbn.split('').map(Number);
  const checksum = digits
    .slice(0, 12)
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);

  if (checksum % 10 !== 10 - digits[12] && checksum % 10 !== 0) {
    throw new Error(
      `Invalid ISBN-13 checksum for "${book.title}" (${book.isbn})`,
    );
  }
};

const loadEnv = (): void => {
  if (typeof process.loadEnvFile !== 'function') {
    throw new Error(
      'This script requires Node.js process.loadEnvFile support.',
    );
  }
  process.loadEnvFile('.env.local');
};

const getClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
};

const getOrCreateUser = async (
  client: SupabaseClient,
  email: string,
  name: string,
): Promise<string> => {
  const { data: users, error: listError } = await client.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = users.users.find((user) => user.email === email);
  if (existing) return existing.id;

  const { data, error } = await client.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user)
    throw error ?? new Error(`Could not create ${email}`);
  return data.user.id;
};

const requireData = <T>(response: {
  data: T | null;
  error: { message: string } | null;
}): T => {
  if (response.error) throw new Error(response.error.message);
  if (response.data === null) throw new Error('Supabase returned no data');
  return response.data;
};

export const seedDemoData = async (): Promise<void> => {
  DEMO_BOOKS.forEach(assertIsbn13);
  const client = getClient();
  const librarianId = await getOrCreateUser(
    client,
    DEMO_LIBRARIAN_EMAIL,
    'Demo Librarian',
  );
  const memberId = await getOrCreateUser(
    client,
    DEMO_MEMBER_EMAIL,
    'Demo Member',
  );

  requireData(
    await client.from('profiles').upsert(
      [
        { id: librarianId, name: 'Demo Librarian', role: 'librarian' },
        { id: memberId, name: 'Demo Member', role: 'member' },
      ],
      { onConflict: 'id' },
    ),
  );

  requireData(await client.from('loans').delete().eq('member_id', memberId));

  const books = requireData(
    await client
      .from('books')
      .upsert(
        DEMO_BOOKS.map((book) => ({
          ...book,
          available_copies: book.total_copies,
        })),
        { onConflict: 'isbn' },
      )
      .select('id,isbn,total_copies'),
  ) as Array<{ id: string; isbn: string; total_copies: number }>;
  const bookByIsbn = new Map(books.map((book) => [book.isbn, book]));
  const today = toCalendarDate(new Date());
  const pendingBook = bookByIsbn.get('9780140328721');
  const issuedBook = bookByIsbn.get('9780743273565');
  const overdueBook = bookByIsbn.get('9780061120084');
  const returnedBook = bookByIsbn.get('9780451524935');
  const returnedLateBook = bookByIsbn.get('9780451529060');
  const paidFineBook = bookByIsbn.get('9780553380163');
  const rejectedBook = bookByIsbn.get('9780345539434');
  const cancelledBook = bookByIsbn.get('9780132350884');

  if (
    !pendingBook ||
    !issuedBook ||
    !overdueBook ||
    !returnedBook ||
    !returnedLateBook ||
    !paidFineBook ||
    !rejectedBook ||
    !cancelledBook
  ) {
    throw new Error('Seed book lookup failed.');
  }

  const issuedOn = addDays(today, -3);
  const overdueIssuedOn = addDays(today, -20);
  const overdueDueDate = addDays(today, -6);
  const returnedOnTime = addDays(today, -1);
  const returnedLate = addDays(today, -4);
  const fine = 4 * FINE_PER_DAY_INR;

  requireData(
    await client.from('loans').insert([
      { book_id: pendingBook.id, member_id: memberId, status: 'pending' },
      {
        book_id: issuedBook.id,
        member_id: memberId,
        status: 'issued',
        issued_on: issuedOn,
        due_date: today,
      },
      {
        book_id: overdueBook.id,
        member_id: memberId,
        status: 'issued',
        issued_on: overdueIssuedOn,
        due_date: overdueDueDate,
      },
      {
        book_id: returnedBook.id,
        member_id: memberId,
        status: 'returned',
        issued_on: addDays(today, -15),
        due_date: addDays(today, -1),
        returned_on: returnedOnTime,
      },
      {
        book_id: returnedLateBook.id,
        member_id: memberId,
        status: 'returned',
        issued_on: addDays(today, -10),
        due_date: addDays(today, -5),
        returned_on: returnedLate,
        fine,
      },
      {
        book_id: paidFineBook.id,
        member_id: memberId,
        status: 'returned',
        issued_on: addDays(today, -12),
        due_date: addDays(today, -6),
        returned_on: today,
        fine: 6 * FINE_PER_DAY_INR,
        fine_paid: true,
      },
      { book_id: rejectedBook.id, member_id: memberId, status: 'rejected' },
      { book_id: cancelledBook.id, member_id: memberId, status: 'cancelled' },
    ]),
  );

  for (const book of books) {
    const issuedResult = await client
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('book_id', book.id)
      .eq('status', 'issued');
    if (issuedResult.error) throw new Error(issuedResult.error.message);
    const issued = issuedResult.count ?? 0;
    requireData(
      await client
        .from('books')
        .update({ available_copies: book.total_copies - issued })
        .eq('id', book.id),
    );
  }

  console.log('DEMO DATA seeded successfully.');
  console.log(`Librarian: ${DEMO_LIBRARIAN_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Member: ${DEMO_MEMBER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Summary: ${books.length} books, 8 member loans, 2 users.`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  seedDemoData().catch((error: unknown) => {
    console.error('Demo data seed failed:', error);
    process.exitCode = 1;
  });
}
