create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('member', 'librarian')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text not null unique,
  category text not null check (
    category in (
      'Fiction',
      'Science',
      'Technology',
      'History',
      'Biography',
      'Self Help',
      'Children'
    )
  ),
  total_copies integer not null check (total_copies >= 1),
  available_copies integer not null check (available_copies >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint available_not_above_total check (available_copies <= total_copies),
  constraint isbn_format check (isbn ~ '^([0-9]{9}[0-9X]|[0-9]{13})$')
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  member_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'issued', 'returned', 'rejected', 'cancelled')
  ),
  requested_at timestamptz not null default now(),
  issued_on date,
  due_date date,
  returned_on date,
  fine integer not null default 0 check (fine >= 0),
  fine_paid boolean not null default false,
  constraint issued_dates_required check (
    status not in ('issued', 'returned')
    or (issued_on is not null and due_date is not null)
  ),
  constraint returned_date_required check (
    status <> 'returned' or returned_on is not null
  ),
  constraint paid_fine_required check (not fine_paid or fine > 0)
);

create index if not exists loans_book_id_idx on public.loans (book_id);
create index if not exists loans_member_id_idx on public.loans (member_id);
create index if not exists loans_status_idx on public.loans (status);
create index if not exists loans_status_due_date_idx
  on public.loans (status, due_date);

create unique index if not exists loans_active_member_book_idx
  on public.loans (member_id, book_id)
  where status in ('pending', 'issued');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Client metadata may provide a name, but it can never promote a user.
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    'member'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
