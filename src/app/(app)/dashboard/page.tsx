import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { countSmtpConfigs } from '@/data/smtp';
import { getDashboardStats } from '@/data/events';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { ArrowPointer, Starburst } from '@/components/editorial/annotations';

export const metadata = { title: 'dashboard — invitewave' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [smtpCount, stats] = await Promise.all([
    countSmtpConfigs(),
    getDashboardStats(),
  ]);
  const hasSmtp = smtpCount > 0;
  const hasEvents = stats.eventsCount > 0;
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];

  return (
    <div className="max-w-5xl">
      <Tag>00 · dashboard</Tag>
      <h1 className="font-display mt-5 text-[5rem] sm:text-[6rem] leading-[0.9] tracking-[-0.04em] lowercase">
        welcome
        {firstName ? <>, <span className="text-[var(--color-electric-blue)]">{firstName.toLowerCase()}</span></> : null}.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
        Calendar invites at scale through your own SMTP server. One last step
        before your first campaign.
      </p>

      <section className="mt-12 grid grid-cols-2 sm:grid-cols-4 border-y border-[var(--color-ink-black)]">
        <Kpi
          value={String(stats.eventsCount)}
          label="events sent"
        />
        <Kpi
          value={stats.recipientsReached.toLocaleString()}
          label="recipients reached"
        />
        <Kpi
          value={stats.successRate === null ? '—' : `${Math.round(stats.successRate * 100)}%`}
          label="success rate"
          hint={stats.successRate === null ? undefined : `${stats.recipientsReached} / ${stats.totalRecipients}`}
        />
        <Kpi
          value={stats.lastSentAt ? fmtRelative(stats.lastSentAt) : '—'}
          label="last sent"
          isLast
        />
      </section>

      <Divider className="my-12" />

      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10">
        {/* Setup card */}
        <div className="relative">
          <Starburst size={48} className="absolute -top-4 -right-4 opacity-90" />
          <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)] p-8">
            <Tag solid>{hasSmtp ? 'connected' : 'step 01'}</Tag>
            <h2 className="font-display mt-4 text-[2.5rem] leading-[0.95] tracking-[-0.02em] lowercase">
              {hasSmtp ? 'smtp connected.' : 'connect your smtp.'}
            </h2>
            <p className="mt-4 text-[15px] text-[var(--color-ink-black)] max-w-md leading-relaxed">
              {hasSmtp
                ? 'You can manage connections in Settings.'
                : 'InviteWave sends through your own SMTP server. Add one to start sending.'}
            </p>
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href={hasSmtp ? ROUTES.send : ROUTES.smtpNew}>
                  {hasSmtp
                    ? hasEvents
                      ? 'send another batch →'
                      : 'send first invite →'
                    : 'connect smtp →'}
                </Link>
              </Button>
              {hasSmtp && hasEvents && (
                <Button asChild variant="outline" size="lg" className="h-11 px-5">
                  <Link href={ROUTES.events}>view events</Link>
                </Button>
              )}
              {hasSmtp && !hasEvents && (
                <Button asChild variant="outline" size="lg" className="h-11 px-5">
                  <Link href={ROUTES.smtp}>manage smtp</Link>
                </Button>
              )}
              {!hasSmtp && (
                <span className="font-hand text-2xl text-[var(--color-electric-blue)]">
                  start here
                </span>
              )}
              {!hasSmtp && <ArrowPointer className="h-6 w-16 -ml-2 -rotate-180" />}
            </div>
          </div>
        </div>

        {/* Roadmap pane */}
        <aside className="bg-[var(--color-ink-black)] text-[var(--color-paper-white)] p-8">
          <Tag className="border-[var(--color-paper-white)] text-[var(--color-paper-white)]">
            roadmap
          </Tag>
          <ul className="mt-6 space-y-4 text-[14px]">
            <RoadmapItem n="01" label="connect smtp" done={hasSmtp} />
            <RoadmapItem n="02" label="send bulk invite" done={hasEvents} />
            <RoadmapItem n="03" label="track delivery" done={hasEvents} />
          </ul>
          <p className="mt-10 editorial-meta text-[var(--color-gray-300)]">
            shipping monthly · 2025
          </p>
        </aside>
      </section>
    </div>
  );
}

function Kpi({
  value,
  label,
  hint,
  isLast,
}: {
  value: string;
  label: string;
  hint?: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={
        'px-5 py-6 sm:px-6 sm:py-7 ' +
        (isLast ? '' : 'sm:border-r border-[var(--color-gray-300)]')
      }
    >
      <div className="font-display text-[2.75rem] sm:text-[3.25rem] leading-[0.9] tracking-[-0.03em] lowercase text-[var(--color-ink-black)]">
        {value}
      </div>
      <div className="editorial-meta mt-3 text-[var(--color-ink-black)]">{label}</div>
      {hint && (
        <div className="mt-1 text-[11px] text-[var(--color-gray-600)]">{hint}</div>
      )}
    </div>
  );
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function RoadmapItem({ n, label, done }: { n: string; label: string; done?: boolean }) {
  return (
    <li className="flex items-baseline gap-4">
      <span className="font-display text-[var(--color-electric-blue)] text-[1.5rem] leading-none">
        {n}
      </span>
      <span className="flex-1 border-b border-dashed border-[var(--color-gray-600)] translate-y-[-4px]" />
      <span
        className={
          done
            ? 'lowercase text-[var(--color-paper-white)] line-through decoration-[var(--color-electric-blue)] decoration-2'
            : 'lowercase text-[var(--color-paper-white)]'
        }
      >
        {label}
      </span>
    </li>
  );
}
