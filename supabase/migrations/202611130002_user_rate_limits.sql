-- Atomic per-user API rate limiting. All mutation is through this RLS-aware function.
create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check (bucket in (
    'wardrobe_read', 'wardrobe_write', 'uploads', 'chat',
    'outfits', 'recommendations', 'daily_outfit'
  )),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, bucket)
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_bucket not in (
    'wardrobe_read', 'wardrobe_write', 'uploads', 'chat',
    'outfits', 'recommendations', 'daily_outfit'
  ) or p_window_seconds < 1 or p_window_seconds > 3600
    or p_max_requests < 1 or p_max_requests > 1000 then
    raise exception 'Invalid rate-limit parameters' using errcode = '22023';
  end if;

  insert into public.api_rate_limits as limits (
    user_id, bucket, window_started_at, request_count
  )
  values (v_user_id, p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
  set
    window_started_at = case
      when limits.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
      then v_now else limits.window_started_at end,
    request_count = case
      when limits.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
      then 1 else limits.request_count + 1 end
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;
