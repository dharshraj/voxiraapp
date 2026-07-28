-- =============================================================================
-- Voxira — Notifications table + Avatars bucket fix
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → paste → RUN
-- Project: cuuxvprdixeshhiwzaug
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null default 'info',
  title      text        not null,
  body       text        not null,
  read       boolean     not null default false,
  icon       text        not null default 'notifications',
  color      text        not null default '#4F6EF7',
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users view own notifications"   on public.notifications;
drop policy if exists "Users insert own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users delete own notifications" on public.notifications;

create policy "Users view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users insert own notifications"
  on public.notifications for insert with check (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

create policy "Users delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- ── avatars bucket (idempotent — safe to re-run) ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar public read"              on storage.objects;
drop policy if exists "Avatar upload for authenticated" on storage.objects;
drop policy if exists "Avatar update own"               on storage.objects;
drop policy if exists "Avatar delete own"               on storage.objects;

create policy "Avatar public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar upload for authenticated"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatar update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Verify ────────────────────────────────────────────────────────────────────
-- After running, check:
--   Table Editor → public.notifications (should exist with RLS enabled)
--   Storage → avatars bucket (should exist, public = true)
-- =============================================================================
