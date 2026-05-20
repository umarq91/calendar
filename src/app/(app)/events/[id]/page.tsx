import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEvent, listEventRecipients } from '@/data/events';
import { ROUTES } from '@/constants/routes';
import { Tag, Divider } from '@/components/editorial/primitives';

export const metadata = { title: 'event — let’s calendar' };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const recipients = await listEventRecipients(id);

  return (
    <div className="max-w-4xl">
      <Link
        href={ROUTES.events}
        className="editorial-meta hover:text-[var(--color-electric-blue)]"
      >
        ← all events
      </Link>
      <Tag className="mt-6">03 · event</Tag>
      <h1 className="font-display mt-5 text-[3.5rem] sm:text-[4.5rem] leading-[0.92] tracking-[-0.03em] lowercase">
        {event.summary}
      </h1>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Stat label="scheduled" value={fmtDateTime(event.start_at)} />
        <Stat label="ends" value={fmtDateTime(event.end_at)} />
        <Stat label="recipients" value={String(event.recipient_count)} />
        <Stat
          label="delivery"
          value={`${event.sent_count} ok · ${event.failed_count} failed`}
        />
      </div>

      {(event.location || event.description) && (
        <div className="mt-10 space-y-4">
          {event.location && (
            <div>
              <div className="editorial-meta">location</div>
              <div className="mt-1 text-[14px]">{event.location}</div>
            </div>
          )}
          {event.description && (
            <div>
              <div className="editorial-meta">description</div>
              <div className="mt-1 text-[14px] whitespace-pre-wrap">{event.description}</div>
            </div>
          )}
        </div>
      )}

      <Divider className="my-12" />

      <h2 className="font-display text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase mb-6">
        recipients
      </h2>

      <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]">
        <header className="grid grid-cols-[1fr_8rem_10rem] gap-4 border-b border-[var(--color-ink-black)] px-6 py-3 editorial-meta">
          <span>recipient</span>
          <span>status</span>
          <span>detail</span>
        </header>
        <ul className="divide-y divide-[var(--color-gray-300)]">
          {recipients.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[1fr_8rem_10rem] gap-4 px-6 py-3 items-baseline text-[13px]"
            >
              <div className="min-w-0">
                {r.name && <div className="font-medium truncate">{r.name}</div>}
                <div className="text-[var(--color-gray-600)] truncate">{r.email}</div>
              </div>
              <div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-[12px] text-[var(--color-gray-600)] truncate">
                {r.status === 'sent' && r.sent_at && fmtDateTime(r.sent_at)}
                {r.status === 'failed' && r.error}
                {r.status === 'pending' && '—'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="editorial-meta">{label}</div>
      <div className="mt-1 text-[14px]">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'sent' | 'failed' }) {
  if (status === 'sent') return <span className="editorial-tag-solid">sent</span>;
  if (status === 'failed') {
    return (
      <span className="editorial-tag border-[var(--color-electric-blue)] text-[var(--color-electric-blue)]">
        failed
      </span>
    );
  }
  return <span className="editorial-tag">pending</span>;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
