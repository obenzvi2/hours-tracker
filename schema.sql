-- ══════════════════════════════════════════════════════
--  Work Hours Tracker — Supabase schema
--  Run this once in the Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- User settings (one row per user)
create table if not exists public.user_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  settings    jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  constraint user_settings_user_id_key unique (user_id)
);

-- Monthly hours (one row per user per month)
create table if not exists public.month_hours (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  month_key       text not null,   -- e.g. "2025_6"  (year _ 0-based month)
  days            jsonb not null default '{}',
  pension_checked boolean not null default true,
  updated_at      timestamptz not null default now(),
  constraint month_hours_user_month_key unique (user_id, month_key)
);

-- Enable Row Level Security
alter table public.user_settings enable row level security;
alter table public.month_hours   enable row level security;

-- Policies: users can only access their own rows
create policy "Users can manage own settings"
  on public.user_settings for all
  using     (auth.uid() = user_id)
  with check(auth.uid() = user_id);

create policy "Users can manage own hours"
  on public.month_hours for all
  using     (auth.uid() = user_id)
  with check(auth.uid() = user_id);
