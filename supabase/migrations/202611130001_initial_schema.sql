-- FitMatch AI production data model.
-- Apply with the Supabase CLI after reviewing the target project and backups.

create extension if not exists pgcrypto;

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('top', 'bottom', 'layer', 'shoes', 'accessory')),
  color text not null default 'black' check (char_length(color) <= 40),
  palette text not null default 'neutral' check (palette in ('neutral', 'earth', 'cool', 'warm', 'monochrome')),
  occasions text[] not null default array['campus']::text[],
  seasons text[] not null default array['spring', 'summer', 'autumn', 'winter']::text[],
  tags text[] not null default '{}'::text[],
  image_path text,
  extracted_image_path text,
  style text check (style is null or char_length(style) <= 40),
  fabric text check (fabric is null or char_length(fabric) <= 40),
  pattern text check (pattern is null or pattern in ('solid', 'striped', 'graphic', 'plaid', 'checkered', 'floral')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wardrobe_occasions_valid check (
    occasions <@ array['campus', 'travel', 'smart-casual', 'streetwear', 'night-out']::text[]
  ),
  constraint wardrobe_seasons_valid check (
    seasons <@ array['spring', 'summer', 'autumn', 'winter']::text[]
  )
);

create index if not exists wardrobe_items_user_created_idx
  on public.wardrobe_items (user_id, created_at desc);

alter table public.wardrobe_items enable row level security;

drop policy if exists "Users can read their own wardrobe" on public.wardrobe_items;
create policy "Users can read their own wardrobe"
  on public.wardrobe_items for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own wardrobe items" on public.wardrobe_items;
create policy "Users can create their own wardrobe items"
  on public.wardrobe_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own wardrobe items" on public.wardrobe_items;
create policy "Users can update their own wardrobe items"
  on public.wardrobe_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own wardrobe items" on public.wardrobe_items;
create policy "Users can delete their own wardrobe items"
  on public.wardrobe_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Private by default. Object keys must start with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-private',
  'wardrobe-private',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users can read their own wardrobe images" on storage.objects;
create policy "Users can read their own wardrobe images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wardrobe-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their own wardrobe images" on storage.objects;
create policy "Users can upload their own wardrobe images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wardrobe-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update their own wardrobe images" on storage.objects;
create policy "Users can update their own wardrobe images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wardrobe-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'wardrobe-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own wardrobe images" on storage.objects;
create policy "Users can delete their own wardrobe images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wardrobe-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
