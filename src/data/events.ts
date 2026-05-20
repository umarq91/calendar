import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventRecipientRow = Database['public']['Tables']['event_recipients']['Row'];

export async function listEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function countEvents(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type DashboardStats = {
  eventsCount: number;
  recipientsReached: number;
  totalRecipients: number;
  /** 0..1 across all recipients ever attempted. null when no recipients yet. */
  successRate: number | null;
  /** created_at of the most recent event that sent ≥1 invite. */
  lastSentAt: string | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('sent_count, failed_count, recipient_count, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const eventsCount = rows.length;
  const recipientsReached = rows.reduce((s, r) => s + r.sent_count, 0);
  const totalRecipients = rows.reduce((s, r) => s + r.recipient_count, 0);
  const successRate = totalRecipients > 0 ? recipientsReached / totalRecipients : null;
  const lastSentAt = rows.find((r) => r.sent_count > 0)?.created_at ?? null;
  return { eventsCount, recipientsReached, totalRecipients, successRate, lastSentAt };
}

export async function listEventRecipients(eventId: string): Promise<EventRecipientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_recipients')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
