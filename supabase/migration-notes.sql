-- PixelNode — Phase 2 + hardening migration. Run once in the Supabase SQL
-- editor on an already-deployed database. Safe to re-run.
-- (New databases get all of this from schema.sql directly.)

-- 1. Admin CRM notes column.
alter table public.leads
  add column if not exists notes text not null default '';

-- 2. Atomic rate-limit increment (race-free; replaces select+upsert).
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
