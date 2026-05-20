'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Divider } from '@/components/editorial/primitives';
import { ROUTES } from '@/constants/routes';
import type { EventRow } from '@/data/events';

const COLS = 'grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_6rem_8rem_2.5rem]';

type DeliveryFilter = 'all' | 'all_sent' | 'partial' | 'all_failed' | 'empty';
type RangeFilter = 'all' | 'today' | '7d' | '30d';
type SortKey = 'newest' | 'oldest' | 'most_recipients' | 'most_failed';

const DELIVERY_OPTIONS: { value: DeliveryFilter; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'all_sent', label: 'all sent' },
  { value: 'partial', label: 'partial' },
  { value: 'all_failed', label: 'all failed' },
  { value: 'empty', label: 'empty' },
];

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: 'all', label: 'all time' },
  { value: 'today', label: 'today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'newest first' },
  { value: 'oldest', label: 'oldest first' },
  { value: 'most_recipients', label: 'most recipients' },
  { value: 'most_failed', label: 'most failed' },
];

export function EventsBrowser({ events }: { events: EventRow[] }) {
  const [search, setSearch] = useState('');
  const [delivery, setDelivery] = useState<DeliveryFilter>('all');
  const [range, setRange] = useState<RangeFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff = rangeCutoff(range);

    const matched = events.filter((e) => {
      if (q) {
        const hay = `${e.summary} ${e.location ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (delivery !== 'all') {
        if (delivery !== deliveryBucket(e)) return false;
      }
      if (cutoff && new Date(e.created_at).getTime() < cutoff) return false;
      return true;
    });

    matched.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_recipients':
          return b.recipient_count - a.recipient_count;
        case 'most_failed':
          return b.failed_count - a.failed_count;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return matched;
  }, [events, search, delivery, range, sort]);

  const totalRecipients = filtered.reduce((s, e) => s + e.recipient_count, 0);
  const totalSent = filtered.reduce((s, e) => s + e.sent_count, 0);

  const activeCount =
    (search.trim().length > 0 ? 1 : 0) +
    (delivery !== 'all' ? 1 : 0) +
    (range !== 'all' ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0);
  const hasActiveFilters = activeCount > 0;
  const [open, setOpen] = useState(false);

  function resetFilters() {
    setSearch('');
    setDelivery('all');
    setRange('all');
    setSort('newest');
  }

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Tag>03 · events</Tag>
          <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
            events.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
            Every batch you&apos;ve sent. Filter, sort, and click into any row
            for per-recipient delivery status.
          </p>
        </div>
        <div className="flex items-baseline gap-8 pb-2">
          <Stat n={filtered.length} label="batches" />
          <Stat n={totalRecipients} label="recipients" />
          <Stat n={totalSent} label="delivered" />
          <Button asChild className="h-11 px-5 ml-2">
            <Link href={ROUTES.send}>new batch →</Link>
          </Button>
        </div>
      </div>

      <Divider className="my-10" />

      <FilterBar
        search={search}
        onSearch={setSearch}
        delivery={delivery}
        onDelivery={setDelivery}
        range={range}
        onRange={setRange}
        sort={sort}
        onSort={setSort}
        total={events.length}
        shown={filtered.length}
        hasActiveFilters={hasActiveFilters}
        activeCount={activeCount}
        onReset={resetFilters}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />

      {filtered.length === 0 ? (
        <div className="mt-6 border border-dashed border-[var(--color-gray-300)] bg-[var(--color-pure-white)] p-12 text-center">
          <h2 className="font-display text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
            no batches match.
          </h2>
          <p className="mt-3 text-[13px] text-[var(--color-gray-600)]">
            Try widening the date range or clearing filters.
          </p>
          {hasActiveFilters && (
            <Button onClick={resetFilters} variant="outline" size="sm" className="mt-5">
              reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]">
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
            {filtered.map((e) => (
              <li key={e.id} className="group">
                <Link
                  href={`${ROUTES.events}/${e.id}`}
                  className={`grid ${COLS} gap-6 items-baseline px-8 py-5 hover:bg-[var(--color-paper-white)] transition-colors`}
                >
                  <div className="min-w-0">
                    <div className="text-[16px] truncate lowercase font-medium">
                      {highlight(e.summary, search)}
                    </div>
                    {e.location && (
                      <div className="mt-1 text-[12px] text-[var(--color-gray-600)] truncate">
                        {highlight(e.location, search)}
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
      )}
    </div>
  );
}

function FilterBar({
  search,
  onSearch,
  delivery,
  onDelivery,
  range,
  onRange,
  sort,
  onSort,
  total,
  shown,
  hasActiveFilters,
  activeCount,
  onReset,
  open,
  onToggle,
}: {
  search: string;
  onSearch: (v: string) => void;
  delivery: DeliveryFilter;
  onDelivery: (v: DeliveryFilter) => void;
  range: RangeFilter;
  onRange: (v: RangeFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  total: number;
  shown: number;
  hasActiveFilters: boolean;
  activeCount: number;
  onReset: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[var(--color-paper-white)] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-[var(--color-electric-blue)]" />
          <span className="editorial-meta">filters</span>
          {activeCount > 0 && (
            <span className="editorial-tag-solid">{activeCount} active</span>
          )}
          {!open && (
            <span className="editorial-meta text-[var(--color-gray-600)] hidden sm:inline">
              · showing {shown.toLocaleString()} of {total.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && open && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  onReset();
                }
              }}
              className="editorial-meta text-[var(--color-electric-blue)] hover:underline underline-offset-2 cursor-pointer"
            >
              reset ×
            </span>
          )}
          <ChevronDown
            className={
              'h-4 w-4 text-[var(--color-ink-black)] transition-transform duration-300 ease-out ' +
              (open ? 'rotate-180' : 'rotate-0')
            }
          />
        </div>
      </button>

      <div
        className={
          'grid transition-[grid-template-rows] duration-300 ease-out ' +
          (open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
        }
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-[var(--color-ink-black)]">
            <div
              className={
                'transition-all duration-300 ease-out ' +
                (open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1')
              }
            >
              <FilterBarBody
                search={search}
                onSearch={onSearch}
                delivery={delivery}
                onDelivery={onDelivery}
                range={range}
                onRange={onRange}
                sort={sort}
                onSort={onSort}
                total={total}
                shown={shown}
                hasActiveFilters={hasActiveFilters}
                onReset={onReset}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBarBody({
  search,
  onSearch,
  delivery,
  onDelivery,
  range,
  onRange,
  sort,
  onSort,
  total,
  shown,
  hasActiveFilters,
  onReset,
}: {
  search: string;
  onSearch: (v: string) => void;
  delivery: DeliveryFilter;
  onDelivery: (v: DeliveryFilter) => void;
  range: RangeFilter;
  onRange: (v: RangeFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  total: number;
  shown: number;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-[var(--color-gray-300)]">
        <div className="relative flex-1 min-w-[18rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-600)] pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="search title or location…"
            className="pl-9 pr-9 h-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-[var(--color-gray-600)] hover:text-[var(--color-electric-blue)]"
              aria-label="clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="editorial-meta text-[var(--color-gray-600)]">sort</label>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="h-11 rounded-[2px] border border-input bg-card px-3 text-[13px] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-gray-300)]">
        <FilterGroup label="delivery">
          {DELIVERY_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={delivery === o.value}
              onClick={() => onDelivery(o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="created">
          {RANGE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={range === o.value}
              onClick={() => onRange(o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </FilterGroup>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-gray-300)] text-[12px]">
        <span className="editorial-meta">
          showing {shown.toLocaleString()} of {total.toLocaleString()}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="editorial-meta text-[var(--color-electric-blue)] hover:underline underline-offset-2"
          >
            reset filters ×
          </button>
        )}
      </div>
    </>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-4">
      <span className="editorial-meta text-[var(--color-gray-600)] mr-1">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'editorial-tag-solid cursor-pointer'
          : 'editorial-tag cursor-pointer hover:border-[var(--color-electric-blue)] hover:text-[var(--color-electric-blue)] transition-colors'
      }
    >
      {children}
    </button>
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
  if (total === 0) return <span className="editorial-tag">empty</span>;
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

function deliveryBucket(e: EventRow): DeliveryFilter {
  if (e.recipient_count === 0) return 'empty';
  if (e.failed_count === 0 && e.sent_count === e.recipient_count) return 'all_sent';
  if (e.sent_count === 0) return 'all_failed';
  return 'partial';
}

function rangeCutoff(range: RangeFilter): number | null {
  if (range === 'all') return null;
  const now = Date.now();
  if (range === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === '7d') return now - 7 * 24 * 60 * 60 * 1000;
  if (range === '30d') return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const i = lower.indexOf(lowerQ);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-[var(--color-electric-blue)] text-[var(--color-pure-white)] px-0.5">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
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
