-- Bulk send: events (batch) + per-recipient send log.
-- One event row per batch. One event_recipients row per address.
-- The ICS UID is shared across the batch so RSVPs collate to one organizer slot.

create type public.event_recipient_status as enum ('pending', 'sent', 'failed');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  smtp_config_id uuid not null references public.smtp_configs(id) on delete restrict,
  ics_uid text not null,
  summary text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  sequence int not null default 0,
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_at timestamptz not null default now()
);

create index events_user_created_at_idx
  on public.events(user_id, created_at desc);

alter table public.events enable row level security;

create policy "events_owner_all" on public.events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.event_recipients (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  status public.event_recipient_status not null default 'pending',
  error text,
  message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index event_recipients_event_idx on public.event_recipients(event_id);
create index event_recipients_user_idx on public.event_recipients(user_id);

alter table public.event_recipients enable row level security;

create policy "event_recipients_owner_all" on public.event_recipients
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
