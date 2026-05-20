import Link from 'next/link';
import { listEvents } from '@/data/events';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { Calendar, ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'events — let’s calendar' };

const COLS = 'grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_6rem_8rem_2.5rem]';

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

  const totalRecipients = events.reduce((s, e) => s + e.recipient_count, 0);
  const totalSent = events.reduce((s, e) => s + e.sent_count, 0);

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Tag>03 · events</Tag>
          <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
            events.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
            Every batch you&apos;ve sent. Click a row for per-recipient delivery
            status.
          </p>
        </div>
        <div className="flex items-baseline gap-8 pb-2">
          <Stat n={events.length} label="batches" />
          <Stat n={totalRecipients} label="recipients" />
          <Stat n={totalSent} label="delivered" />
          <Button asChild className="h-11 px-5 ml-2">
            <Link href={ROUTES.send}>new batch →</Link>
          </Button>
        </div>
      </div>

      <Divider className="my-10" />

      <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]">
        <header
          className={`grid ${COLS} gap-6 border-b border-[var(--color-ink-black)] px-8 py-4 editorial-meta`}
        >
          <span>title</span>
          <span>created</span>
          <span>scheduled</span>
          <span className="text-right">recipients</span>
          <span className="text-right">delivery</span>
          <span />
        </header>
        <ul className="divide-y divide-[var(--color-gray-300)]">
          {events.map((e) => (
            <li key={e.id} className="group">
              <Link
                href={`${ROUTES.events}/${e.id}`}
                className={`grid ${COLS} gap-6 items-baseline px-8 py-5 hover:bg-[var(--color-paper-white)] transition-colors`}
              >
                <div className="min-w-0">
                  <div className="text-[16px] truncate lowercase font-medium">
                    {e.summary}
                  </div>
                  {e.location && (
                    <div className="mt-1 text-[12px] text-[var(--color-gray-600)] truncate">
                      {e.location}
                    </div>
                  )}
                </div>
                <CellTime iso={e.created_at} />
                <CellTime iso={e.start_at} accent />
                <div className="text-right text-[14px] tabular-nums">
                  {e.recipient_count}
                </div>
                <div className="text-right">
                  <DeliveryBadge
                    sent={e.sent_count}
                    failed={e.failed_count}
                    total={e.recipient_count}
                  />
                </div>
                <div className="flex justify-end">
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-gray-600)] group-hover:text-[var(--color-electric-blue)] transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-[2rem] leading-none lowercase tabular-nums">
        {n.toLocaleString()}
      </div>
      <div className="editorial-meta mt-1.5 text-[var(--color-gray-600)]">{label}</div>
    </div>
  );
}

function CellTime({ iso, accent }: { iso: string; accent?: boolean }) {
  const date = fmtDate(iso);
  const time = fmtTime(iso);
  return (
    <div className="text-[13px] leading-tight">
      <div
        className={
          accent
            ? 'text-[var(--color-ink-black)] font-medium'
            : 'text-[var(--color-ink-black)]'
        }
      >
        {date}
      </div>
      <div className="text-[12px] text-[var(--color-gray-600)] mt-0.5">
        {time}
      </div>
    </div>
  );
}

function DeliveryBadge({
  sent,
  failed,
  total,
}: {
  sent: number;
  failed: number;
  total: number;
}) {
  if (total === 0) return <span className="editorial-tag">pending</span>;
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
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
