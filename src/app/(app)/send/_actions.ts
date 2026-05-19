'use server';

import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';
import { buildIcs } from '@/lib/ics';
import { sendInviteSchema } from './schema';

export type SendResult =
  | { ok: true; messageId: string; recipientEmail: string }
  | {
      ok: false;
      error: string;
      step: 'auth' | 'validate' | 'no_smtp' | 'decrypt' | 'transport' | 'send';
    };

export async function sendInvite(raw: unknown): Promise<SendResult> {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.', step: 'auth' };

  // Validate
  const parsed = sendInviteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      step: 'validate',
    };
  }
  const input = parsed.data;

  // Resolve default SMTP for this user
  const { data: defaultRow, error: defaultErr } = await supabase
    .from('smtp_configs')
    .select('id')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (defaultErr) {
    return { ok: false, error: defaultErr.message, step: 'no_smtp' };
  }
  if (!defaultRow) {
    return { ok: false, error: 'No SMTP connection configured.', step: 'no_smtp' };
  }

  // Decrypt password via owner-only SECURITY DEFINER RPC
  const { data: smtpRows, error: rpcErr } = await supabase.rpc('get_smtp_with_password', {
    p_config_id: defaultRow.id,
  });
  if (rpcErr || !smtpRows || smtpRows.length === 0) {
    return {
      ok: false,
      error: rpcErr?.message ?? 'Could not load SMTP credentials.',
      step: 'decrypt',
    };
  }
  const smtp = smtpRows[0];

  // Build ICS
  const ics = buildIcs({
    uid: `${crypto.randomUUID()}@letscalendarclone`,
    start: input.start_local,
    end: input.end_local,
    summary: input.summary,
    description: input.description || undefined,
    location: input.location || undefined,
    organizer: { name: smtp.from_name, email: smtp.from_email },
    attendees: [
      {
        name: input.recipient_name || undefined,
        email: input.recipient_email,
      },
    ],
  });

  // Build transport
  let transporter: nodemailer.Transporter;
  try {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.username, pass: smtp.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to build SMTP transport.',
      step: 'transport',
    };
  }

  // Send. nodemailer's icalEvent adds proper text/calendar parts so Gmail/Outlook render
  // an inline RSVP card instead of just a generic attachment.
  try {
    const info = await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to: input.recipient_name
        ? `"${input.recipient_name}" <${input.recipient_email}>`
        : input.recipient_email,
      replyTo: smtp.reply_to || undefined,
      subject: input.summary,
      text:
        (input.description ? `${input.description}\n\n` : '') +
        `Calendar invite from ${smtp.from_name} <${smtp.from_email}>.`,
      icalEvent: {
        method: 'REQUEST',
        filename: 'invite.ics',
        content: ics,
      },
    });
    return { ok: true, messageId: info.messageId, recipientEmail: input.recipient_email };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to send invite.',
      step: 'send',
    };
  }
}
