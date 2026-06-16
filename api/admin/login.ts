import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSupabase } from '../../lib/supabase.js';
import { consumeRateLimit } from '../../lib/rateLimit.js';
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

  // Rate-limit login attempts per IP to slow brute force. This endpoint fails
  // CLOSED: if the limiter store can't be consulted we reject the attempt rather
  // than allow unlimited guesses. (The contact form fails open; auth must not.)
  const ip = `login:${getClientIp(req)}`;
  let db;
  try {
    db = getSupabase();
  } catch {
    return res.status(503).json({ ok: false, error: 'Login temporarily unavailable. Try again later.' });
  }

  const limit = await consumeRateLimit(db, ip);
  if (limit.degraded) {
    return res.status(503).json({ ok: false, error: 'Login temporarily unavailable. Try again later.' });
  }
  if (!limit.allowed) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
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
