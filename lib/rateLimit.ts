import type { SupabaseClient } from '@supabase/supabase-js';

const WINDOW_MINUTES = 60;
const MAX_PER_WINDOW = 5; // 5 actions per IP per hour

function currentWindow(): string {
  const ms = WINDOW_MINUTES * 60_000;
  return new Date(Math.floor(Date.now() / ms) * ms).toISOString();
}

export interface RateLimitResult {
  allowed: boolean;
  /** true when the limiter store could not be consulted (caller decides policy). */
  degraded: boolean;
}

/**
 * Atomically increment the IP's counter for the current window and report
 * whether it is now within the cap. Uses a single Postgres function
 * (increment_rate_limit) so concurrent requests cannot all read the same
 * pre-increment value and bypass the limit (race-free, unlike select+upsert).
 *
 * On a store error it returns { allowed: true, degraded: true } so the CALLER
 * can choose policy: contact form fails open (don't lose a lead), admin login
 * fails closed (don't drop brute-force protection).
 */
export async function consumeRateLimit(db: SupabaseClient, ip: string): Promise<RateLimitResult> {
  if (!ip || ip === 'unknown') return { allowed: true, degraded: false };

  try {
    const { data, error } = await db.rpc('increment_rate_limit', {
      p_ip: ip,
      p_window: currentWindow()
    });

    if (error || typeof data !== 'number') {
      return { allowed: true, degraded: true };
    }
    return { allowed: data <= MAX_PER_WINDOW, degraded: false };
  } catch {
    return { allowed: true, degraded: true };
  }
}
