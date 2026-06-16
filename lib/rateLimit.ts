import type { SupabaseClient } from '@supabase/supabase-js';

const WINDOW_MINUTES = 60;
const MAX_PER_WINDOW = 5; // 5 submissions per IP per hour

/**
 * Supabase-backed per-IP rate limit. Survives serverless cold starts because
 * the counter lives in the database, not in function memory.
 *
 * Returns true if the request is ALLOWED, false if the IP is over the limit.
 * Fails open: if the rate-limit store errors, we allow the request rather than
 * block a genuine lead (the honeypot still guards against bots).
 */
export async function checkRateLimit(db: SupabaseClient, ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return true;

  // Bucket the current time into a fixed window so all requests in the same
  // hour share one counter row.
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (WINDOW_MINUTES * 60_000)) * (WINDOW_MINUTES * 60_000)
  ).toISOString();

  try {
    // Read current count for this IP + window.
    const { data: existing, error: readErr } = await db
      .from('rate_limits')
      .select('count')
      .eq('ip', ip)
      .eq('window_start', windowStart)
      .maybeSingle();

    if (readErr) return true; // fail open

    const current = existing?.count ?? 0;
    if (current >= MAX_PER_WINDOW) return false;

    // Upsert the incremented counter.
    const { error: writeErr } = await db
      .from('rate_limits')
      .upsert(
        { ip, window_start: windowStart, count: current + 1 },
        { onConflict: 'ip,window_start' }
      );

    if (writeErr) return true; // fail open
    return true;
  } catch {
    return true; // fail open
  }
}
