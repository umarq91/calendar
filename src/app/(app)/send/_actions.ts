'use server';

import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';
import { buildIcs } from '@/lib/ics';
import { parseRecipients } from '@/lib/recipients';
import { sendInviteSchema } from './schema';

export type RecipientResult = {
  email: string;
  name?: string;
  ok: boolean;
  error?: string;
};

export type SendResult =
  | {
      ok: true;
      eventId: string;
      total: number;
      sent: number;
      failed: number;
      results: RecipientResult[];
    }
  | {
      ok: false;
      error: string;
      step: 'auth' | 'validate' | 'no_smtp' | 'decrypt' | 'persist' | 'transport';
    };

const THROTTLE_MS = 150;

export async function sendBulkInvite(raw: unknown): Promise<SendResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.', step: 'auth' };

  const parsed = sendInviteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      step: 'validate',
    };
  }
  const input = parsed.data;
  const recipients = parseRecipients(input.recipients_raw).recipients;

  const { data: defaultRow, error: defaultErr } = await supabase
    .from('smtp_configs')
    .select('id')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (defaultErr) return { ok: false, error: defaultErr.message, step: 'no_smtp' };
  if (!defaultRow) {
    return { ok: false, error: 'No SMTP connection configured.', step: 'no_smtp' };
  }

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

  const icsUid = `${crypto.randomUUID()}@letscalendarclone`;
  const startAt = new Date(input.start_local).toISOString();
  const endAt = new Date(input.end_local).toISOString();

  const { data: eventRow, error: insertErr } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      smtp_config_id: defaultRow.id,
      ics_uid: icsUid,
      summary: input.summary,
      description: input.description || null,
      location: input.location || null,
      start_at: startAt,
      end_at: endAt,
      recipient_count: recipients.length,
    })
    .select('id')
    .single();
  if (insertErr || !eventRow) {
    return {
      ok: false,
      error: insertErr?.message ?? 'Failed to create event.',
      step: 'persist',
    };
  }
  const eventId = eventRow.id;

  const { data: recipientRows, error: recErr } = await supabase
    .from('event_recipients')
    .insert(
      recipients.map((r) => ({
        event_id: eventId,
        user_id: user.id,
        email: r.email,
        name: r.name ?? null,
      })),
    )
    .select('id, email, name');
  if (recErr || !recipientRows) {
    return {
      ok: false,
      error: recErr?.message ?? 'Failed to create recipient rows.',
      step: 'persist',
    };
  }

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
      pool: true,
      maxConnections: 1,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to build SMTP transport.',
      step: 'transport',
    };
  }

  // All attendees listed inside one VEVENT so each recipient sees the roster
  // and RSVPs collate to a single organizer slot.
  const ics = buildIcs({
    uid: icsUid,
    start: input.start_local,
    end: input.end_local,
    summary: input.summary,
    description: input.description || undefined,
    location: input.location || undefined,
    organizer: { name: smtp.from_name, email: smtp.from_email },
    attendees: recipients.map((r) => ({ name: r.name, email: r.email })),
  });

  const results: RecipientResult[] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipientRows.length; i += 1) {
    const row = recipientRows[i];
    const r = recipients[i];
    try {
      const info = await transporter.sendMail({
        from: `"${smtp.from_name}" <${smtp.from_email}>`,
        to: r.name ? `"${r.name}" <${r.email}>` : r.email,
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
      await supabase
        .from('event_recipients')
        .update({
          status: 'sent',
          message_id: info.messageId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      sent += 1;
      results.push({ email: r.email, name: r.name, ok: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Send failed.';
      await supabase
        .from('event_recipients')
        .update({ status: 'failed', error: errorMsg })
        .eq('id', row.id);
      failed += 1;
      results.push({ email: r.email, name: r.name, ok: false, error: errorMsg });
    }

    if (i < recipientRows.length - 1) {
      await new Promise((res) => setTimeout(res, THROTTLE_MS));
    }
  }

  transporter.close();

  await supabase
    .from('events')
    .update({ sent_count: sent, failed_count: failed })
    .eq('id', eventId);

  return {
    ok: true,
    eventId,
    total: recipients.length,
    sent,
    failed,
    results,
  };
}
