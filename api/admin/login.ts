import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSupabase } from '../../lib/supabase.js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { createSession, sessionCookie, passwordMatches } from '../../lib/auth.js';

const LoginSchema = z.object({
  password: z.string().min(1).max(200)
});

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].trim();
  return (req.socket?.remoteAddress as string) || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Password required' });
  }

  // Rate-limit login attempts per IP to slow brute force (reuses the lead limiter).
  const ip = `login:${getClientIp(req)}`;
  try {
    const db = getSupabase();
    const allowed = await checkRateLimit(db, ip);
    if (!allowed) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
    }
  } catch {
    // If the limiter store is unavailable, continue — password check still guards.
  }

  if (!passwordMatches(parsed.data.password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  }

  let token: string;
  try {
    token = await createSession();
  } catch {
    return res.status(500).json({ ok: false, error: 'Server auth not configured' });
  }

  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ ok: true });
}
