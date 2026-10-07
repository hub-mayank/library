create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from public, anon, authenticated;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_start timestamptz;
begin
  -- This is the one place SQL uses now(): infrastructure timing, not a business rule.
  insert into public.rate_limits(key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
  set window_start = case
      when public.rate_limits.window_start + make_interval(secs => p_window_seconds) <= now()
      then now() else public.rate_limits.window_start end,
    count = case
      when public.rate_limits.window_start + make_interval(secs => p_window_seconds) <= now()
      then 1 else public.rate_limits.count + 1 end
  returning window_start, count into current_start, current_count;
  if current_count <= p_limit then
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object(
    'ok', false,
    'retry_after', greatest(1, ceil(extract(epoch from (current_start + make_interval(secs => p_window_seconds) - now())))::integer)
  );
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

create or replace function public.delete_stale_rate_limits(p_older_than_seconds integer)
returns integer
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits
  where window_start < now() - make_interval(secs => p_older_than_seconds);
  select 1;
$$;

-- TODO(Prompt F): invoke this cleanup once daily from the cron route.
revoke all on function public.delete_stale_rate_limits(integer) from public, anon, authenticated;
grant execute on function public.delete_stale_rate_limits(integer) to service_role;
