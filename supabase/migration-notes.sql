-- PixelNode — Phase 2 migration: add notes to leads for the admin CRM.
-- Run this once in the Supabase SQL editor. Safe to re-run.

alter table public.leads
  add column if not exists notes text not null default '';
