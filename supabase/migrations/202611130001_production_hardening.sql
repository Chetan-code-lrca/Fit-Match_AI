-- FitMatch AI production baseline. Apply in Supabase SQL Editor before enabling hosted use.

create table if not exists public.wardrobe_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 80),
  item jsonb not null check (jsonb_typeof(item) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists wardrobe_items_user_created_idx on public.wardrobe_items (user_id, created_at desc);

alter table public.wardrobe_items enable row level security;
revoke all on table public.wardrobe_items from anon, authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;

drop policy if exists "Users read their own wardrobe" on public.wardrobe_items;
create policy "Users read their own wardrobe" on public.wardrobe_items
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users add to their own wardrobe" on public.wardrobe_items;
create policy "Users add to their own wardrobe" on public.wardrobe_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own wardrobe" on public.wardrobe_items;
create policy "Users update their own wardrobe" on public.wardrobe_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their own wardrobe" on public.wardrobe_items;
create policy "Users delete their own wardrobe" on public.wardrobe_items
  for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe-private', 'wardrobe-private', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own wardrobe images" on storage.objects;
create policy "Users upload their own wardrobe images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'wardrobe-private' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "Users view their own wardrobe images" on storage.objects;
create policy "Users view their own wardrobe images" on storage.objects
  for select to authenticated using (
    bucket_id = 'wardrobe-private' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "Users update their own wardrobe images" on storage.objects;
create policy "Users update their own wardrobe images" on storage.objects
  for update to authenticated using (
    bucket_id = 'wardrobe-private' and (storage.foldername(name))[1] = (select auth.uid()::text)
  ) with check (
    bucket_id = 'wardrobe-private' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "Users delete their own wardrobe images" on storage.objects;
create policy "Users delete their own wardrobe images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'wardrobe-private' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create table if not exists public.fitmatch_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check (char_length(bucket) between 1 and 48),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, bucket)
);
alter table public.fitmatch_rate_limits enable row level security;
revoke all on table public.fitmatch_rate_limits from anon, authenticated;

create or replace function public.consume_fitmatch_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_user_id is null or p_bucket is null or p_bucket !~ '^[a-z0-9:_-]{1,48}$'
     or p_limit < 1 or p_limit > 120 or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;
  insert into public.fitmatch_rate_limits (user_id, bucket, window_started_at, request_count)
  values (v_user_id, p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update set
    window_started_at = case
      when public.fitmatch_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then v_now else public.fitmatch_rate_limits.window_started_at end,
    request_count = case
      when public.fitmatch_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then 1 else public.fitmatch_rate_limits.request_count + 1 end
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_fitmatch_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_fitmatch_rate_limit(text, integer, integer) to authenticated;

create or replace function public.fitmatch_health()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select true; $$;
revoke all on function public.fitmatch_health() from public;
grant execute on function public.fitmatch_health() to anon, authenticated;
