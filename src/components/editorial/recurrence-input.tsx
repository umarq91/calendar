'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Info, Repeat } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  type EndKind,
  type Frequency,
  type MonthlyMode,
  type Recurrence,
  type WeekdayCode,
  WEEKDAY_CODES,
  WEEKDAY_LABEL,
  generateOccurrences,
  summarize,
} from '@/lib/recurrence';

type Value = {
  recurrence: Recurrence;
  exdates: string[]; // ISO strings of excluded occurrence instants
};

type Props = {
  value: Value;
  onChange: (next: Value) => void;
  /** The event's start (local "YYYY-MM-DDTHH:mm") — drives occurrence generation. */
  startLocal: string;
  disabled?: boolean;
  defaultOpen?: boolean;
};

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'none', label: 'one-time' },
  { value: 'daily', label: 'daily' },
  { value: 'weekly', label: 'weekly' },
  { value: 'monthly', label: 'monthly' },
  { value: 'yearly', label: 'yearly' },
];

export function RecurrenceInput({
  value,
  onChange,
  startLocal,
  disabled,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [excludeOpen, setExcludeOpen] = useState(false);
  const { recurrence, exdates } = value;

  const summary = useMemo(
    () => summarize(recurrence, startLocal),
    [recurrence, startLocal],
  );

  const occurrences = useMemo(
    () => generateOccurrences(recurrence, startLocal, 24),
    [recurrence, startLocal],
  );

  function patchRecurrence(patch: Partial<Recurrence>) {
    onChange({ recurrence: { ...recurrence, ...patch }, exdates });
  }

  function setExdates(next: string[]) {
    onChange({ recurrence, exdates: next });
  }

  function toggleException(iso: string) {
    if (exdates.includes(iso)) {
      setExdates(exdates.filter((d) => d !== iso));
    } else {
      setExdates([...exdates, iso]);
    }
  }

  function toggleWeekday(code: WeekdayCode) {
    const has = recurrence.byday.includes(code);
    const next = has
      ? recurrence.byday.filter((c) => c !== code)
      : [...recurrence.byday, code];
    patchRecurrence({ byday: next });
  }

  const showWeekly = recurrence.freq === 'weekly';
  const showMonthly = recurrence.freq === 'monthly';
  const showInterval = recurrence.freq !== 'none';
  const showEnd = recurrence.freq !== 'none';
  const showExceptions = recurrence.freq !== 'none' && occurrences.length > 0;

  const isRecurring = recurrence.freq !== 'none';

  return (
    <div
      className={cn(
        'w-full border border-[var(--color-ink-black)] bg-[var(--color-pure-white)]',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-4 px-5 py-4 text-left',
          'hover:bg-[var(--color-paper-white)] transition-colors',
          open && 'border-b border-[var(--color-ink-black)] bg-[var(--color-paper-white)]',
        )}
      >
        <div className="flex items-center gap-4 min-w-0">
          <Repeat
            className={cn(
              'h-4 w-4 shrink-0',
              isRecurring
                ? 'text-[var(--color-electric-blue)]'
                : 'text-[var(--color-gray-600)]',
            )}
          />
          <div className="min-w-0">
            <div className="editorial-meta text-[var(--color-gray-600)]">recurrence</div>
            <div
              className={cn(
                'mt-1 text-[15px] truncate',
                isRecurring
                  ? 'text-[var(--color-ink-black)] font-medium'
                  : 'text-[var(--color-gray-600)]',
              )}
            >
              {summary}
              {exdates.length > 0 && (
                <span className="ml-2 text-[var(--color-electric-blue)]">
                  · {exdates.length} excluded
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={cn(
              'editorial-meta hidden sm:inline transition-colors',
              open ? 'text-[var(--color-electric-blue)]' : 'text-[var(--color-gray-600)]',
            )}
          >
            {open ? 'hide' : 'edit'}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-300 ease-out',
              open ? 'rotate-180 text-[var(--color-electric-blue)]' : 'text-[var(--color-ink-black)]',
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={cn(
              'transition-all duration-300 ease-out',
              open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
            )}
          >
            <Section title="frequency">
              <div className="flex flex-wrap gap-2">
                {FREQ_OPTIONS.map((f) => (
                  <Chip
                    key={f.value}
                    active={recurrence.freq === f.value}
                    onClick={() => patchRecurrence({ freq: f.value })}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </Section>

            {showInterval && (
              <Section
                title="interval"
                info="Spacing between occurrences. Doesn't decide when the series stops — that's the job of ends."
              >
                <div className="flex flex-wrap items-center gap-3 text-[14px]">
                  <span>every</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={recurrence.interval}
                    onChange={(e) =>
                      patchRecurrence({ interval: clamp(Number(e.target.value), 1, 99) })
                    }
                    className="h-9 w-16 rounded-[2px] border border-input bg-card px-2 text-center tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <span>{intervalUnit(recurrence.freq, recurrence.interval)}</span>
                </div>
              </Section>
            )}

            {showWeekly && (
              <Section title="repeat on">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_CODES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleWeekday(code)}
                      className={cn(
                        'h-9 w-11 flex items-center justify-center text-[13px] lowercase border transition-colors',
                        recurrence.byday.includes(code)
                          ? 'bg-[var(--color-electric-blue)] border-[var(--color-electric-blue)] text-[var(--color-pure-white)]'
                          : 'border-[var(--color-ink-black)] text-[var(--color-ink-black)] hover:bg-[var(--color-paper-white)]',
                      )}
                    >
                      {WEEKDAY_LABEL[code]}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-[var(--color-gray-600)]">
                  Empty selection defaults to the start day&apos;s weekday.
                </p>
              </Section>
            )}

            {showMonthly && (
              <Section title="monthly pattern">
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={recurrence.monthlyMode === 'date'}
                    onClick={() => patchRecurrence({ monthlyMode: 'date' as MonthlyMode })}
                  >
                    on this day-of-month
                  </Chip>
                  <Chip
                    active={recurrence.monthlyMode === 'nth'}
                    onClick={() => patchRecurrence({ monthlyMode: 'nth' as MonthlyMode })}
                  >
                    on this weekday-of-month
                  </Chip>
                </div>
              </Section>
            )}

            {showEnd && (
              <Section
                title="ends"
                info={
                  <>
                    Stop sign for the series. Works alongside interval — they never conflict.
                    <br />
                    <br />
                    <strong className="font-medium">never</strong> — runs forever.
                    <br />
                    <strong className="font-medium">after N</strong> — stops after N occurrences, regardless of date.
                    <br />
                    <strong className="font-medium">on date</strong> — stops on or before the picked date.
                  </>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={recurrence.endKind === 'never'}
                    onClick={() => patchRecurrence({ endKind: 'never' as EndKind })}
                  >
                    never
                  </Chip>
                  <Chip
                    active={recurrence.endKind === 'count'}
                    onClick={() =>
                      patchRecurrence({
                        endKind: 'count' as EndKind,
                        count: recurrence.count ?? 10,
                      })
                    }
                  >
                    after N occurrences
                  </Chip>
                  <Chip
                    active={recurrence.endKind === 'until'}
                    onClick={() =>
                      patchRecurrence({
                        endKind: 'until' as EndKind,
                        until: recurrence.until ?? defaultUntil(startLocal),
                      })
                    }
                  >
                    on date
                  </Chip>
                </div>

                {recurrence.endKind === 'count' && (
                  <div className="mt-3 flex items-center gap-3 text-[14px]">
                    <span>after</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={recurrence.count ?? 10}
                      onChange={(e) =>
                        patchRecurrence({ count: clamp(Number(e.target.value), 1, 999) })
                      }
                      className="h-9 w-20 rounded-[2px] border border-input bg-card px-2 text-center tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <span>occurrences</span>
                  </div>
                )}

                {recurrence.endKind === 'until' && (
                  <div className="mt-3 flex items-center gap-3 text-[14px]">
                    <span>until</span>
                    <input
                      type="date"
                      value={(recurrence.until ?? '').slice(0, 10)}
                      onChange={(e) => {
                        const date = e.target.value;
                        if (!date) return;
                        const t = (recurrence.until ?? startLocal).slice(11) || '23:59';
                        patchRecurrence({ until: `${date}T${t}` });
                      }}
                      className="h-9 rounded-[2px] border border-input bg-card px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                )}
              </Section>
            )}

            {showExceptions && (
              <section className="border-b border-[var(--color-gray-300)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExcludeOpen((v) => !v)}
                  aria-expanded={excludeOpen}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--color-paper-white)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="editorial-meta text-[var(--color-gray-600)]">
                      exclude dates
                    </span>
                    {exdates.length > 0 && (
                      <span className="editorial-tag-solid">{exdates.length}</span>
                    )}
                    <InfoTip>
                      Skip specific occurrences in the series. Recipients&apos; calendars
                      automatically omit the dates you toggle here.
                    </InfoTip>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-300 ease-out',
                      excludeOpen
                        ? 'rotate-180 text-[var(--color-electric-blue)]'
                        : 'text-[var(--color-ink-black)]',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    excludeOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden min-h-0">
                    <div
                      className={cn(
                        'px-5 pb-4 pt-1 transition-all duration-300 ease-out',
                        excludeOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
                      )}
                    >
                      <div className="flex flex-wrap gap-2">
                        {occurrences.map((occ) => {
                          const iso = occ.toISOString();
                          const excluded = exdates.includes(iso);
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => toggleException(iso)}
                              className={cn(
                                'h-9 px-3 inline-flex items-center gap-2 border text-[12px] tabular-nums transition-colors',
                                excluded
                                  ? 'bg-[var(--color-electric-blue)] border-[var(--color-electric-blue)] text-[var(--color-pure-white)] line-through decoration-2'
                                  : 'border-[var(--color-ink-black)] text-[var(--color-ink-black)] hover:bg-[var(--color-paper-white)]',
                              )}
                            >
                              {fmtOccurrence(occ)}
                            </button>
                          );
                        })}
                      </div>
                      {exdates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExdates([])}
                          className="mt-3 editorial-meta text-[var(--color-electric-blue)] hover:underline underline-offset-2"
                        >
                          clear exclusions ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <footer className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[var(--color-ink-black)]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-4 bg-[var(--color-ink-black)] text-[var(--color-pure-white)] text-[12px] tracking-[0.06em] uppercase hover:bg-[var(--color-electric-blue)] transition-colors"
              >
                done
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  info,
  children,
}: {
  title: string;
  subtitle?: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-4 border-b border-[var(--color-gray-300)] last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="editorial-meta text-[var(--color-gray-600)]">{title}</span>
        {info && <InfoTip>{info}</InfoTip>}
      </div>
      {subtitle && (
        <div className="text-[12px] text-[var(--color-gray-600)] mt-0.5">
          {subtitle}
        </div>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <span
        role="img"
        aria-label="more info"
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center text-[var(--color-gray-600)] hover:text-[var(--color-electric-blue)] focus-visible:text-[var(--color-electric-blue)] outline-none cursor-help"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span
        role="tooltip"
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-6 top-1/2 -translate-y-1/2 z-20 w-[20rem] border border-[var(--color-ink-black)] bg-[var(--color-pure-white)] px-3 py-2 text-[12px] text-[var(--color-ink-black)] leading-relaxed shadow-[4px_4px_0_var(--color-ink-black)] pointer-events-none"
      >
        {children}
      </span>
    </span>
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

function intervalUnit(freq: Frequency, n: number): string {
  switch (freq) {
    case 'daily':
      return n === 1 ? 'day' : 'days';
    case 'weekly':
      return n === 1 ? 'week' : 'weeks';
    case 'monthly':
      return n === 1 ? 'month' : 'months';
    case 'yearly':
      return n === 1 ? 'year' : 'years';
    default:
      return '';
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.floor(n)));
}

function defaultUntil(startLocal: string): string {
  const base = startLocal ? new Date(startLocal) : new Date();
  base.setMonth(base.getMonth() + 3);
  const p = (x: number) => String(x).padStart(2, '0');
  return (
    `${base.getFullYear()}-${p(base.getMonth() + 1)}-${p(base.getDate())}` +
    `T${p(base.getHours())}:${p(base.getMinutes())}`
  );
}

function fmtOccurrence(d: Date): string {
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
