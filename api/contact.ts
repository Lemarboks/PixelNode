import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { consumeRateLimit } from '../lib/rateLimit.js';
import { sendLeadEmails } from '../lib/email.js';

// Payload contract — kept in sync with the contact form fields.
const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required').max(200),
  project: z.string().trim().min(1, 'Project type is required').max(120),
  message: z.string().trim().min(1, 'Project details are required').max(5000),
  // Honeypot: a hidden field real users never fill. Bots usually do.
  company: z.string().optional()
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

  // 1. Validate.
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Invalid submission';
    return res.status(400).json({ ok: false, error: first });
  }
  const { name, email, project, message, company } = parsed.data;

  // 2. Honeypot — silently accept so bots don't learn they were caught,
  //    but never store or email the submission.
  if (company && company.trim().length > 0) {
    return res.status(200).json({ ok: true });
  }

  const ip = getClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || null;

  // 3. Rate limit. The contact form fails OPEN on a limiter outage — we would
  //    rather risk extra submissions than silently drop a genuine lead.
  let db;
  try {
    db = getSupabase();
  } catch {
    return res.status(500).json({ ok: false, error: 'Server is not configured. Please email us directly.' });
  }

  const limit = await consumeRateLimit(db, ip);
  if (!limit.allowed) {
    return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
  }

  // 4. Persist the lead — this is the durable record. If it fails, we stop here.
  const { error: insertErr } = await db.from('leads').insert({
    name,
    email,
    project,
    message,
    ip,
    user_agent: userAgent
  });

  if (insertErr) {
    return res.status(500).json({ ok: false, error: 'Could not save your message. Please email us directly.' });
  }

  // 5. Email (best-effort; the lead is already safely stored).
  try {
    await sendLeadEmails({ name, email, project, message });
  } catch {
    // swallow — the lead is captured; email is a convenience, not a guarantee.
  }

  return res.status(200).json({ ok: true });
}
