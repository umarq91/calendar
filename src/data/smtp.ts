import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type SmtpConfig = Database['public']['Tables']['smtp_configs']['Row'];

/** Server-only: list SMTP configs owned by the current authed user (newest first). */
export async function listSmtpConfigs(): Promise<SmtpConfig[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('smtp_configs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Server-only: count of SMTP configs owned by the current authed user. */
export async function countSmtpConfigs(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('smtp_configs')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

/**
 * Server-only: return the user's default SMTP config (no password).
 * Falls back to the most-recently-created config if no default is set.
 */
export async function getDefaultSmtpForCurrentUser(): Promise<SmtpConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('smtp_configs')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
