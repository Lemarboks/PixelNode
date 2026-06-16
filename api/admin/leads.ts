import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSupabase } from '../../lib/supabase.js';
import { isAuthenticated, clearCookie } from '../../lib/auth.js';

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'won', 'lost']).optional(),
  notes: z.string().max(5000).optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Logout — clear the cookie. No auth needed to log out.
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }

  // Everything else requires a valid admin session.
  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  let db;
  try {
    db = getSupabase();
  } catch {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  // List all leads, newest first.
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('leads')
      .select('id, name, email, project, message, status, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ ok: false, error: 'Could not load leads' });
    }
    return res.status(200).json({ ok: true, leads: data ?? [] });
  }

  // Update a lead's status and/or notes.
  if (req.method === 'PATCH') {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid update' });
    }
    const { id, status, notes } = parsed.data;
    if (status === undefined && notes === undefined) {
      return res.status(400).json({ ok: false, error: 'Nothing to update' });
    }

    const patch: Record<string, string> = {};
    if (status !== undefined) patch.status = status;
    if (notes !== undefined) patch.notes = notes;

    const { error } = await db.from('leads').update(patch).eq('id', id);
    if (error) {
      return res.status(500).json({ ok: false, error: 'Could not update lead' });
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
