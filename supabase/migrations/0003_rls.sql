/*
  Reads use row-level security. All writes go through service-role functions,
  after the application has checked the authenticated caller's role.
*/

create or replace function public.is_librarian()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'librarian'
  );
$$;

revoke all on function public.is_librarian() from public, anon;
grant execute on function public.is_librarian() to authenticated;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.loans enable row level security;

drop policy if exists profiles_select_own_or_librarian on public.profiles;
create policy profiles_select_own_or_librarian
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_librarian());

drop policy if exists books_select_authenticated on public.books;
create policy books_select_authenticated
on public.books
for select
to authenticated
using (true);

drop policy if exists loans_select_member_or_librarian on public.loans;
create policy loans_select_member_or_librarian
on public.loans
for select
to authenticated
using (member_id = auth.uid() or public.is_librarian());

revoke all on table public.profiles, public.books, public.loans from public, anon;
grant select on table public.profiles, public.books, public.loans to authenticated;
revoke insert, update, delete on table public.profiles, public.books, public.loans
from authenticated;
