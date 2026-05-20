'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['s', 'm', 't', 'w', 't', 'f', 's'];
const MONTH_LABELS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MINUTE_STEPS = [0, 15, 30, 45];

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Inclusive lower bound. Selecting a moment equal to `min` is allowed. */
  min?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** Header label shown in the collapsed toggle bar. */
  label: string;
  /** Start expanded? Default false. */
  defaultOpen?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  min,
  disabled,
  ariaLabel,
  label,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const parsed = useMemo(() => parseLocal(value), [value]);
  const minDate = useMemo(() => parseLocal(min), [min]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const floor = useMemo(() => {
    const candidates = [today];
    if (minDate) candidates.push(startOfDay(minDate));
    return candidates.reduce((a, b) => (a > b ? a : b));
  }, [today, minDate]);

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(parsed ?? minDate ?? today),
  );

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  function selectDay(day: Date) {
    const current = parsed ?? roundedFuture(15);
    const next = new Date(day);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);

    if (minDate && next < minDate) {
      const m = new Date(minDate);
      next.setHours(m.getHours(), m.getMinutes(), 0, 0);
      const min15 = Math.ceil(next.getMinutes() / 15) * 15;
      if (min15 >= 60) {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      } else {
        next.setMinutes(min15, 0, 0);
      }
    }
    onChange(formatLocal(next));
  }

  function changeTime(hour: number, minute: number, ampm: 'AM' | 'PM') {
    const base = parsed ?? new Date(viewMonth);
    const next = new Date(base);
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    next.setHours(h, minute, 0, 0);
    if (minDate && next < minDate) return;
    if (next < floor && sameDay(next, today)) return;
    onChange(formatLocal(next));
  }

  function setNow() {
    const n = roundedFuture(0);
    if (minDate && n < minDate) {
      onChange(formatLocal(minDate));
      return;
    }
    onChange(formatLocal(n));
  }

  const display = parsed ? formatDisplay(parsed) : 'no time picked yet';
  const prevDisabled =
    addMonths(viewMonth, -1) < startOfMonth(floor);

  return (
    <div
      aria-label={ariaLabel}
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
        <div className="min-w-0">
          <div className="editorial-meta text-[var(--color-gray-600)]">{label}</div>
          <div
            className={cn(
              'mt-1 text-[15px] truncate',
              parsed ? 'text-[var(--color-ink-black)] font-medium' : 'text-[var(--color-gray-600)]',
            )}
          >
            {display}
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
            <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-[var(--color-gray-300)]">
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                disabled={prevDisabled}
                className="h-9 w-9 inline-flex items-center justify-center hover:bg-[var(--color-paper-white)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <div className="font-display text-[1.75rem] leading-none lowercase tracking-[-0.02em]">
                  {MONTH_LABELS[viewMonth.getMonth()]}
                </div>
                <div className="editorial-meta text-[var(--color-gray-600)] mt-1">
                  {viewMonth.getFullYear()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="h-9 w-9 inline-flex items-center justify-center hover:bg-[var(--color-paper-white)] transition-colors"
                aria-label="next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </header>

            <div className="grid grid-cols-7 px-4 pt-4 pb-1 editorial-meta text-center text-[var(--color-gray-600)]">
              {WEEKDAY_LABELS.map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
              {days.map((day, idx) => {
                if (!day) return <div key={idx} className="h-11" />;
                const isPast = day < floor;
                const isToday = sameDay(day, today);
                const isSelected = parsed && sameDay(day, parsed);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDay(day)}
                    disabled={isPast}
                    className={cn(
                      'h-11 flex items-center justify-center text-[14px] tabular-nums transition-colors',
                      'hover:bg-[var(--color-paper-white)]',
                      isPast &&
                        'text-[var(--color-gray-300)] hover:bg-transparent cursor-not-allowed line-through decoration-1',
                      !isPast && !isSelected && 'text-[var(--color-ink-black)]',
                      isToday && !isSelected &&
                        'ring-1 ring-[var(--color-electric-blue)] ring-inset font-medium',
                      isSelected &&
                        'bg-[var(--color-electric-blue)] text-[var(--color-pure-white)] hover:bg-[var(--color-electric-blue)] font-medium',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <TimeRow
              value={parsed}
              day={parsed}
              minDate={minDate ?? undefined}
              today={today}
              onTimeChange={changeTime}
            />

            <footer className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--color-gray-300)]">
              <button
                type="button"
                onClick={setNow}
                className="h-9 px-4 border border-[var(--color-ink-black)] text-[12px] tracking-[0.06em] uppercase hover:bg-[var(--color-electric-blue)] hover:text-[var(--color-pure-white)] hover:border-[var(--color-electric-blue)] transition-colors"
              >
                now
              </button>
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

function TimeRow({
  value,
  day,
  minDate,
  today,
  onTimeChange,
}: {
  value: Date | null;
  day: Date | null;
  minDate?: Date;
  today: Date;
  onTimeChange: (hour: number, minute: number, ampm: 'AM' | 'PM') => void;
}) {
  const current = value ?? new Date();
  const hour24 = current.getHours();
  const ampm: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = roundToStep(current.getMinutes(), MINUTE_STEPS);

  const matchesMinDay = minDate && day && sameDay(day, minDate);
  const matchesToday = day && sameDay(day, today);

  const lowerBound = matchesMinDay ? minDate! : matchesToday ? today : null;

  function disabledForHour(h12: number, ap: 'AM' | 'PM'): boolean {
    if (!lowerBound || !day) return false;
    let h = h12 % 12;
    if (ap === 'PM') h += 12;
    const candidate = new Date(day);
    candidate.setHours(h, 59, 59, 999);
    return candidate < lowerBound;
  }

  function disabledForMinute(m: number): boolean {
    if (!lowerBound || !day) return false;
    let h = hour12 % 12;
    if (ampm === 'PM') h += 12;
    const candidate = new Date(day);
    candidate.setHours(h, m, 0, 0);
    return candidate < lowerBound;
  }

  return (
    <div className="border-t border-[var(--color-gray-300)] px-5 py-4 flex flex-wrap items-center gap-3">
      <span className="editorial-meta text-[var(--color-gray-600)]">time</span>
      <SelectBox
        value={hour12}
        onChange={(v) => onTimeChange(v, minute, ampm)}
        options={Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({
          value: h,
          label: pad(h),
          disabled: disabledForHour(h, ampm),
        }))}
      />
      <span className="text-[var(--color-gray-600)]">:</span>
      <SelectBox
        value={minute}
        onChange={(v) => onTimeChange(hour12, v, ampm)}
        options={MINUTE_STEPS.map((m) => ({
          value: m,
          label: pad(m),
          disabled: disabledForMinute(m),
        }))}
      />
      <div className="ml-auto inline-flex border border-[var(--color-ink-black)]">
        {(['AM', 'PM'] as const).map((a) => {
          const active = a === ampm;
          const blocked = disabledForHour(hour12, a);
          return (
            <button
              key={a}
              type="button"
              disabled={blocked}
              onClick={() => onTimeChange(hour12, minute, a)}
              className={cn(
                'h-9 w-12 text-[12px] tracking-[0.06em]',
                active
                  ? 'bg-[var(--color-ink-black)] text-[var(--color-pure-white)]'
                  : 'bg-transparent text-[var(--color-ink-black)] hover:bg-[var(--color-paper-white)]',
                blocked && 'opacity-30 pointer-events-none',
              )}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string; disabled?: boolean }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-[2px] border border-input bg-card px-3 text-[14px] tabular-nums focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ───────────────────────────── helpers ─────────────────────────────

function parseLocal(v: string | undefined | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}`
  );
}

function formatDisplay(d: Date): string {
  const date = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const offset = monthStart.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let i = 1; i <= daysInMonth; i += 1) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), i));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function roundToStep(value: number, steps: number[]): number {
  return steps.reduce((prev, cur) =>
    Math.abs(cur - value) < Math.abs(prev - value) ? cur : prev,
  );
}

function roundedFuture(addMinutes: number): Date {
  const d = new Date(Date.now() + addMinutes * 60_000);
  const m = Math.ceil(d.getMinutes() / 15) * 15;
  if (m >= 60) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  } else {
    d.setMinutes(m, 0, 0);
  }
  return d;
}
