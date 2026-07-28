-- =============================================================================
-- Voxira — Initial Schema Migration
-- Run this ONCE in the Supabase SQL Editor for project cuuxvprdixeshhiwzaug
-- Dashboard → SQL Editor → paste → RUN
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically via trigger on auth.users.
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

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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

-- RLS for profiles
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

-- ── speech_sessions ───────────────────────────────────────────────────────────
create table if not exists public.speech_sessions (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  mode             text        not null default 'Free Speech',
  score            integer     not null default 0,
  duration         integer     not null default 0,   -- seconds
  wpm              integer     not null default 0,
  filler_count     integer     not null default 0,
  filler_breakdown jsonb       not null default '{}',
  transcript       text        not null default '',
  clarity          integer     not null default 0,
  pace             integer     not null default 0,
  pronunciation    integer     not null default 0,
  confidence       integer     not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists speech_sessions_user_id_idx
  on public.speech_sessions(user_id, created_at desc);

alter table public.speech_sessions enable row level security;

drop policy if exists "Users can insert own speech sessions" on public.speech_sessions;
drop policy if exists "Users can select own speech sessions" on public.speech_sessions;
drop policy if exists "Users can delete own speech sessions" on public.speech_sessions;

create policy "Users can insert own speech sessions"
  on public.speech_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can select own speech sessions"
  on public.speech_sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete own speech sessions"
  on public.speech_sessions for delete
  using (auth.uid() = user_id);

-- ── interview_sessions ────────────────────────────────────────────────────────
create table if not exists public.interview_sessions (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  role            text        not null default '',
  difficulty      text        not null default 'Medium',
  interview_type  text        not null default 'Behavioral',
  avg_score       integer     not null default 0,
  question_count  integer     not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists interview_sessions_user_id_idx
  on public.interview_sessions(user_id, created_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "Users can insert own interview sessions" on public.interview_sessions;
drop policy if exists "Users can select own interview sessions" on public.interview_sessions;

create policy "Users can insert own interview sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can select own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

-- ── Storage bucket: avatars ───────────────────────────────────────────────────
-- Run in SQL Editor (storage API is not in plain SQL but this works via the
-- internal storage schema):
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage RLS — authenticated users can upload/update their own avatar
drop policy if exists "Avatar upload for authenticated" on storage.objects;
drop policy if exists "Avatar public read"              on storage.objects;
drop policy if exists "Avatar delete own"               on storage.objects;
drop policy if exists "Avatar update own"               on storage.objects;

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

-- ── Backfill profiles for existing auth users ─────────────────────────────────
-- If users already exist in auth.users but have no profile row yet, create them.
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
-- DONE. Schema cache refreshes automatically after DDL.
-- Verify in Table Editor: profiles, speech_sessions, interview_sessions
-- Verify in Storage: avatars bucket (public)
-- =============================================================================

-- ── user_preferences ──────────────────────────────────────────────────────────
-- Stores per-user notification preferences.
create table if not exists public.user_preferences (
  id                   uuid        primary key default uuid_generate_v4(),
  user_id              uuid        unique not null references auth.users(id) on delete cascade,
  notif_master         boolean     not null default true,
  notif_daily_remind   boolean     not null default true,
  notif_streak_alert   boolean     not null default true,
  notif_score_update   boolean     not null default true,
  notif_tips           boolean     not null default true,
  notif_achievements   boolean     not null default true,
  notif_weekly         boolean     not null default false,
  notif_remind_time    text        not null default '9:00 AM',
  speech_daily_target  integer     not null default 2,
  updated_at           timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users manage own preferences" on public.user_preferences;
create policy "Users manage own preferences"
  on public.user_preferences
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── notifications ─────────────────────────────────────────────────────────────
-- Stores in-app notifications generated by session saves, achievements, etc.
create table if not exists public.notifications (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null default 'score',
  title      text        not null default '',
  body       text        not null default '',
  icon       text        not null default 'notifications-outline',
  color      text        not null default '#92400E',
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications"
  on public.notifications
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Fix "email not verified" for existing accounts ────────────────────────────
-- Accounts created BEFORE "Confirm email" was disabled in Supabase Auth settings
-- may still have email_confirmed_at = NULL. This marks all existing users as
-- confirmed so they can sign in without a verification email.
--
-- Run this once after disabling email confirmation in:
--   Supabase Dashboard → Authentication → Providers → Email → Confirm email OFF
--
-- Safe to re-run — only updates rows where email_confirmed_at is currently null.
update auth.users
set    email_confirmed_at = now()
where  email_confirmed_at is null;
