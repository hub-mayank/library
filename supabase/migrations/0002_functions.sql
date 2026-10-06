create or replace function public.request_loan(
  p_member uuid,
  p_book uuid,
  p_max_loans integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  book_available integer;
  active_loans integer;
  loan_id uuid;
begin
  if not exists (select 1 from public.profiles where id = p_member) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  perform 1 from public.profiles where id = p_member for update;

  if not exists (select 1 from public.books where id = p_book) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if exists (
    select 1
    from public.loans
    where member_id = p_member
      and book_id = p_book
      and status in ('pending', 'issued')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_request');
  end if;

  select available_copies
  into book_available
  from public.books
  where id = p_book;

  if book_available = 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_copies_available');
  end if;

  select count(*)::integer
  into active_loans
  from public.loans
  where member_id = p_member
    and status in ('pending', 'issued');

  if active_loans >= p_max_loans then
    return jsonb_build_object('ok', false, 'reason', 'loan_limit_reached');
  end if;

  insert into public.loans (book_id, member_id, status)
  values (p_book, p_member, 'pending')
  returning id into loan_id;

  return jsonb_build_object('ok', true, 'id', loan_id::text);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_request');
end;
$$;

create or replace function public.approve_loan(
  p_loan uuid,
  p_loan_days integer,
  p_today date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loan_book uuid;
  loan_status text;
  book_available integer;
begin
  select status, book_id
  into loan_status, loan_book
  from public.loans
  where id = p_loan
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if loan_status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  select available_copies
  into book_available
  from public.books
  where id = loan_book
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if book_available <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_copies_available');
  end if;

  update public.books
  set available_copies = available_copies - 1
  where id = loan_book;

  update public.loans
  set status = 'issued',
      issued_on = p_today,
      due_date = p_today + p_loan_days
  where id = p_loan;

  return jsonb_build_object('ok', true, 'id', p_loan::text);
end;
$$;

create or replace function public.reject_loan(p_loan uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loan_status text;
begin
  select status into loan_status
  from public.loans
  where id = p_loan
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if loan_status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  update public.loans
  set status = 'rejected'
  where id = p_loan;

  return jsonb_build_object('ok', true, 'id', p_loan::text);
end;
$$;

create or replace function public.cancel_loan(p_loan uuid, p_member uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loan_member uuid;
  loan_status text;
begin
  select member_id, status
  into loan_member, loan_status
  from public.loans
  where id = p_loan
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if loan_member <> p_member then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if loan_status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  update public.loans
  set status = 'cancelled'
  where id = p_loan;

  return jsonb_build_object('ok', true, 'id', p_loan::text);
end;
$$;

create or replace function public.return_loan(
  p_loan uuid,
  p_fine_per_day integer,
  p_today date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loan_book uuid;
  loan_status text;
  loan_due_date date;
  book_available integer;
  book_total integer;
  calculated_fine integer;
begin
  select status, book_id, due_date
  into loan_status, loan_book, loan_due_date
  from public.loans
  where id = p_loan
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if loan_status <> 'issued' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  select available_copies, total_copies
  into book_available, book_total
  from public.books
  where id = loan_book
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if book_available >= book_total then
    return jsonb_build_object('ok', false, 'reason', 'invalid_total');
  end if;

  calculated_fine = greatest(0, p_today - loan_due_date) * p_fine_per_day;

  update public.books
  set available_copies = available_copies + 1
  where id = loan_book;

  update public.loans
  set status = 'returned',
      returned_on = p_today,
      fine = calculated_fine
  where id = p_loan;

  return jsonb_build_object('ok', true, 'id', p_loan::text);
end;
$$;

create or replace function public.mark_fine_paid(p_loan uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loan_status text;
  loan_fine integer;
  loan_fine_paid boolean;
begin
  select status, fine, fine_paid
  into loan_status, loan_fine, loan_fine_paid
  from public.loans
  where id = p_loan
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if loan_status <> 'returned' or loan_fine <= 0 or loan_fine_paid then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  update public.loans
  set fine_paid = true
  where id = p_loan;

  return jsonb_build_object('ok', true, 'id', p_loan::text);
end;
$$;

create or replace function public.update_book_copies(
  p_book uuid,
  p_new_total integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  old_total integer;
  old_available integer;
  issued integer;
begin
  select total_copies, available_copies
  into old_total, old_available
  from public.books
  where id = p_book
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  issued = old_total - old_available;

  if p_new_total is null or p_new_total < 1 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_total');
  end if;

  if p_new_total < issued then
    return jsonb_build_object('ok', false, 'reason', 'below_issued_count');
  end if;

  update public.books
  set total_copies = p_new_total,
      available_copies = p_new_total - issued
  where id = p_book;

  return jsonb_build_object('ok', true, 'id', p_book::text);
end;
$$;

create or replace function public.delete_book(p_book uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.books where id = p_book for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if exists (
    select 1
    from public.loans
    where book_id = p_book
      and status in ('pending', 'issued')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'has_active_loans');
  end if;

  if exists (
    select 1
    from public.loans
    where book_id = p_book
      and status = 'returned'
      and fine > 0
      and not fine_paid
  ) then
    return jsonb_build_object('ok', false, 'reason', 'has_unpaid_fines');
  end if;

  -- History is deliberately stricter because loans.book_id uses ON DELETE RESTRICT.
  if exists (select 1 from public.loans where book_id = p_book) then
    return jsonb_build_object('ok', false, 'reason', 'book_has_history');
  end if;

  delete from public.books where id = p_book;
  return jsonb_build_object('ok', true, 'id', p_book::text);
end;
$$;

revoke all on function public.request_loan(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.approve_loan(uuid, integer, date) from public, anon, authenticated;
revoke all on function public.reject_loan(uuid) from public, anon, authenticated;
revoke all on function public.cancel_loan(uuid, uuid) from public, anon, authenticated;
revoke all on function public.return_loan(uuid, integer, date) from public, anon, authenticated;
revoke all on function public.mark_fine_paid(uuid) from public, anon, authenticated;
revoke all on function public.update_book_copies(uuid, integer) from public, anon, authenticated;
revoke all on function public.delete_book(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- App functions are called only from the server with the service role,
-- after the app has checked the caller's role.
grant execute on function public.request_loan(uuid, uuid, integer) to service_role;
grant execute on function public.approve_loan(uuid, integer, date) to service_role;
grant execute on function public.reject_loan(uuid) to service_role;
grant execute on function public.cancel_loan(uuid, uuid) to service_role;
grant execute on function public.return_loan(uuid, integer, date) to service_role;
grant execute on function public.mark_fine_paid(uuid) to service_role;
grant execute on function public.update_book_copies(uuid, integer) to service_role;
grant execute on function public.delete_book(uuid) to service_role;
grant execute on function public.handle_new_user() to service_role;
