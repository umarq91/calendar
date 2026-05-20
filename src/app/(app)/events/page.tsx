import Link from 'next/link';
import { listEvents } from '@/data/events';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { Calendar } from 'lucide-react';

export const metadata = { title: 'events — let’s calendar' };

export default async function EventsListPage() {
  const events = await listEvents();

  if (events.length === 0) {
    return (
      <div className="max-w-3xl">
        <Tag>03 · events</Tag>
        <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
          no events
          <br />
          yet.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
          Each batch you send shows up here with per-recipient status.
        </p>
        <Divider className="my-12" />
        <div className="border border-dashed border-[var(--color-gray-300)] bg-[var(--color-pure-white)] p-10 text-center">
          <Calendar className="h-6 w-6 mx-auto text-[var(--color-electric-blue)]" />
          <h2 className="font-display mt-4 text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
            send your first batch.
          </h2>
          <Button asChild className="mt-6 h-11 px-5">
            <Link href={ROUTES.send}>send invite →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Tag>03 · events</Tag>
      <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
        events.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
        Every batch you&apos;ve sent. Click a row for per-recipient delivery
        status.
      </p>

      <Divider className="my-10" />

      <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]">
        <header className="grid grid-cols-[1fr_10rem_8rem_8rem] gap-4 border-b border-[var(--color-ink-black)] px-6 py-3 editorial-meta">
          <span>title</span>
          <span>scheduled</span>
          <span className="text-right">recipients</span>
          <span className="text-right">delivery</span>
        </header>
        <ul className="divide-y divide-[var(--color-gray-300)]">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`${ROUTES.events}/${e.id}`}
                className="grid grid-cols-[1fr_10rem_8rem_8rem] gap-4 px-6 py-4 items-baseline hover:bg-[var(--color-paper-white)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[15px] truncate lowercase">{e.summary}</div>
                  <div className="editorial-meta text-[var(--color-gray-600)] mt-1">
                    sent {fmtDate(e.created_at)}
                  </div>
                </div>
                <div className="text-[13px]">{fmtDate(e.start_at)}</div>
                <div className="text-right text-[13px]">{e.recipient_count}</div>
                <div className="text-right text-[13px]">
                  <DeliveryBadge sent={e.sent_count} failed={e.failed_count} total={e.recipient_count} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DeliveryBadge({ sent, failed, total }: { sent: number; failed: number; total: number }) {
  if (failed === 0 && sent === total) {
    return <span className="editorial-tag-solid">all sent</span>;
  }
  if (sent === 0) {
    return (
      <span className="editorial-tag border-[var(--color-electric-blue)] text-[var(--color-electric-blue)]">
        all failed
      </span>
    );
  }
  return (
    <span className="editorial-tag">
      {sent}/{total} ok
    </span>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
