-- PixelNode — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS and idempotent policies.

-- ---------------------------------------------------------------------------
-- leads: every contact-form submission is captured here.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  project     text not null,
  message     text not null,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'won', 'lost')),
  notes       text not null default '',
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Backfill for databases created before `notes` existed (idempotent).
alter table public.leads add column if not exists notes text not null default '';

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx      on public.leads (status);

-- ---------------------------------------------------------------------------
-- rate_limits: per-IP submission counter so a single client cannot flood
-- the contact endpoint. Survives serverless cold starts (unlike in-memory).
-- One row per IP per time window.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  ip            text not null,
  window_start  timestamptz not null,
  count         integer not null default 1,
  primary key (ip, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- ---------------------------------------------------------------------------
-- increment_rate_limit: atomically bump (or create) the counter for an IP in a
-- window and return the NEW count. Using a single INSERT ... ON CONFLICT DO
-- UPDATE makes the read-and-increment race-free, unlike a separate select+upsert
-- which lets concurrent requests all read the same value and bypass the cap.
-- ---------------------------------------------------------------------------
create or replace function public.increment_rate_limit(p_ip text, p_window timestamptz)
returns integer as $$
declare
  new_count integer;
begin
  insert into public.rate_limits (ip, window_start, count)
  values (p_ip, p_window, 1)
  on conflict (ip, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The API uses the SERVICE ROLE key, which bypasses RLS. We still enable RLS
-- and add NO public policies, so the anon/public key can never read leads.
-- This keeps lead data private even if the anon key is ever exposed.
-- ---------------------------------------------------------------------------
alter table public.leads       enable row level security;
alter table public.rate_limits enable row level security;

-- updated_at auto-touch on lead updates (used by the Phase 2 admin CRM).
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();
