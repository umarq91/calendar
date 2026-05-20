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
