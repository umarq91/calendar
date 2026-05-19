'use server';

import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';
import { smtpFormSchema, type SmtpFormInput } from './schema';
import { revalidatePath } from 'next/cache';

export type VerifyResult =
  | { ok: true; configId: string; testEmailTo: string }
  | { ok: false; error: string; step: 'auth' | 'validate' | 'verify' | 'test_email' | 'persist' };

export async function verifySmtpConfig(raw: unknown): Promise<VerifyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, error: 'Not authenticated.', step: 'auth' };
  }

  const parsed = smtpFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      step: 'validate',
    };
  }
  const input: SmtpFormInput = parsed.data;

  const transporter = nodemailer.createTransport({
    host: input.host,
    port: input.port,
    secure: input.secure,
    auth: { user: input.username, pass: input.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  try {
    await transporter.verify();
  } catch (err) {
    return {
      ok: false,
      error: `Could not connect to ${input.host}:${input.port}. ${
        err instanceof Error ? err.message : 'Unknown error'
      }`,
      step: 'verify',
    };
  }

  const token = crypto.randomUUID();
  try {
    await transporter.sendMail({
      from: `"${input.from_name}" <${input.from_email}>`,
      to: user.email,
      subject: 'InviteWave: SMTP test passed',
      text: `Your SMTP connection is working. (Token: ${token})\n\nIf you didn't expect this email, you can safely ignore it.`,
      html: `<p>Your SMTP connection is working.</p>
             <p style="color:#888;font-size:12px">Token: <code>${token}</code></p>
             <p style="color:#888;font-size:12px">If you didn't expect this email, you can safely ignore it.</p>`,
    });
  } catch (err) {
    return {
      ok: false,
      error: `Connection OK but the test email failed to send: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`,
      step: 'test_email',
    };
  }

  const { data: configId, error: rpcError } = await supabase.rpc('create_smtp_config', {
    p_label: input.label,
    p_from_name: input.from_name,
    p_from_email: input.from_email,
    p_host: input.host,
    p_port: input.port,
    p_secure: input.secure,
    p_username: input.username,
    p_password: input.password,
    p_reply_to: input.reply_to || null,
  });

  if (rpcError || !configId) {
    return {
      ok: false,
      error: rpcError?.message ?? 'Failed to save SMTP config.',
      step: 'persist',
    };
  }

  revalidatePath('/settings/smtp');
  return { ok: true, configId, testEmailTo: user.email };
}

export async function deleteSmtpConfig(configId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not authenticated' };

  const { error } = await supabase.rpc('delete_smtp_config', { p_config_id: configId });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/settings/smtp');
  return { ok: true as const };
}

export async function setDefaultSmtpConfig(configId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not authenticated' };

  // Clear existing default for this user, then set the new one.
  await supabase.from('smtp_configs').update({ is_default: false }).eq('user_id', user.id);
  const { error } = await supabase
    .from('smtp_configs')
    .update({ is_default: true })
    .eq('id', configId)
    .eq('user_id', user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/settings/smtp');
  return { ok: true as const };
}

export async function sendTestEmail(configId: string) {
  // Re-testing an existing config requires decrypting the Vault secret server-side.
  // That RPC is intentionally not part of this phase. Re-add the config to re-test.
  void configId;
  return {
    ok: false as const,
    error: 'Re-testing requires re-entering the password. Delete and re-add to re-test.',
  };
}
