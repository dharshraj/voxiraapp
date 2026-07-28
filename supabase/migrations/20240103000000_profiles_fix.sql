-- =============================================================================
-- Voxira — Profiles table fix (idempotent)
-- Run in Supabase SQL Editor:  Dashboard → SQL Editor → paste → RUN
-- Project: cuuxvprdixeshhiwzaug
--
-- WHY THIS EXISTS
-- The initial migration (20240101000000) may not have been run, OR it ran
-- but the profiles table was not created (e.g. the SQL editor stopped early
-- due to a storage error).  This migration creates the profiles table and
-- all supporting objects if they don't already exist.  It is safe to run
-- even if profiles already exists — every statement uses IF NOT EXISTS or
-- OR REPLACE.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ── profiles table ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  full_name    text        not null default '',
  email        text        not null default '',
  level        text        not null default 'Beginner',
  streak_days  integer     not null default 0,
  avatar_url   text,
  bio          text,
  goals        text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Add updated_at column if it was missing from an older schema version
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── Trigger: auto-create a profile row on new signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Backfill: create profile rows for any existing auth users without one ──────
-- This handles accounts that were created BEFORE this migration was run.
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.email, '')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- =============================================================================
-- DONE.  Verify in Supabase Table Editor:
--   public.profiles  — should exist, RLS = enabled, row(s) for your account
--
-- After running, tap "Save" in the app's Edit Profile screen — it should
-- succeed without the "schema cache" error.
-- =============================================================================
