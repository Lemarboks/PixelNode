import { Resend } from 'resend';

export interface LeadEmailInput {
  name: string;
  email: string;
  project: string;
  message: string;
}

/**
 * Sends two emails via Resend:
 *  1. Notification to the PixelNode inbox with the full lead.
 *  2. A friendly auto-reply to the client confirming receipt.
 *
 * Both addresses are read from env. Fails soft: if email sending throws, the
 * lead is still saved in the DB, so a transient Resend outage never loses a lead.
 */
export async function sendLeadEmails(lead: LeadEmailInput): Promise<{ owner: boolean; reply: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.LEAD_FROM_EMAIL; // e.g. "PixelNode <hello@pixelnode.dev>"
  const ownerInbox = process.env.LEAD_TO_EMAIL;    // where you receive leads

  if (!apiKey || !fromAddress || !ownerInbox) {
    throw new Error('Email env vars missing: RESEND_API_KEY / LEAD_FROM_EMAIL / LEAD_TO_EMAIL');
  }

  const resend = new Resend(apiKey);
  const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

  const result = { owner: false, reply: false };

  // 1. Notify the owner.
  try {
    await resend.emails.send({
      from: fromAddress,
      to: ownerInbox,
      replyTo: lead.email,
      subject: `New PixelNode lead: ${lead.name} — ${lead.project}`,
      html: `
        <h2>New project inquiry</h2>
        <p><strong>Name:</strong> ${esc(lead.name)}</p>
        <p><strong>Email:</strong> ${esc(lead.email)}</p>
        <p><strong>Project type:</strong> ${esc(lead.project)}</p>
        <p><strong>Details:</strong></p>
        <p style="white-space:pre-wrap">${esc(lead.message)}</p>
      `
    });
    result.owner = true;
  } catch {
    result.owner = false;
  }

  // 2. Auto-reply to the client.
  try {
    await resend.emails.send({
      from: fromAddress,
      to: lead.email,
      subject: 'Thanks for reaching out to PixelNode',
      html: `
        <p>Hi ${esc(lead.name)},</p>
        <p>Thanks for getting in touch with PixelNode. We've received your
        ${esc(lead.project).toLowerCase()} inquiry and will reply with a clear
        next step shortly.</p>
        <p>— The PixelNode team</p>
      `
    });
    result.reply = true;
  } catch {
    result.reply = false;
  }

  return result;
}
