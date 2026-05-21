/**
 * Recurrence: a small RFC 5545 RRULE / EXDATE helper.
 *
 * - `Recurrence` is the structured form the UI manipulates.
 * - `buildRrule(rec, start)` serializes to the RRULE value (no `RRULE:` prefix).
 * - `summarize(rec, start)` returns a human-readable description.
 * - `generateOccurrences(rec, start, limit)` lists the next N occurrence dates.
 * - `formatExdateUtc(date)` produces UTC strings suitable for EXDATE.
 */

export const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export const WEEKDAY_LABEL: Record<WeekdayCode, string> = {
  SU: 'sun',
  MO: 'mon',
  TU: 'tue',
  WE: 'wed',
  TH: 'thu',
  FR: 'fri',
  SA: 'sat',
};

export type Frequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type MonthlyMode = 'date' | 'nth';
export type EndKind = 'never' | 'count' | 'until';

export type Recurrence = {
  freq: Frequency;
  interval: number;
  byday: WeekdayCode[];
  monthlyMode: MonthlyMode;
  endKind: EndKind;
  count?: number;
  until?: string; // local "YYYY-MM-DDTHH:mm"
};

export const NONE_RECURRENCE: Recurrence = {
  freq: 'none',
  interval: 1,
  byday: [],
  monthlyMode: 'date',
  endKind: 'never',
};

export function buildRrule(rec: Recurrence, startLocal: string): string | null {
  if (rec.freq === 'none') return null;
  const start = new Date(startLocal);
  const parts: string[] = [`FREQ=${rec.freq.toUpperCase()}`];

  if (rec.interval > 1) parts.push(`INTERVAL=${rec.interval}`);

  if (rec.freq === 'weekly') {
    const days = rec.byday.length ? rec.byday : [WEEKDAY_CODES[start.getDay()]];
    parts.push(`BYDAY=${days.join(',')}`);
  }
  if (rec.freq === 'monthly') {
    if (rec.monthlyMode === 'nth') {
      const nth = Math.ceil(start.getDate() / 7);
      parts.push(`BYDAY=${nth}${WEEKDAY_CODES[start.getDay()]}`);
    } else {
      parts.push(`BYMONTHDAY=${start.getDate()}`);
    }
  }

  if (rec.endKind === 'count' && rec.count && rec.count > 0) {
    parts.push(`COUNT=${rec.count}`);
  }
  if (rec.endKind === 'until' && rec.until) {
    parts.push(`UNTIL=${formatUtcStamp(new Date(rec.until))}`);
  }

  return parts.join(';');
}

export function summarize(rec: Recurrence, startLocal: string): string {
  if (rec.freq === 'none') return 'one-time event';
  const start = startLocal ? new Date(startLocal) : new Date();
  const everyN = rec.interval > 1 ? `every ${rec.interval} ` : 'every ';

  let base = '';
  if (rec.freq === 'daily') {
    base = rec.interval > 1 ? `every ${rec.interval} days` : 'every day';
  } else if (rec.freq === 'weekly') {
    const days = (rec.byday.length ? rec.byday : [WEEKDAY_CODES[start.getDay()]])
      .map((d) => WEEKDAY_LABEL[d])
      .join(', ');
    base = `${everyN}week${rec.interval > 1 ? 's' : ''} on ${days}`;
  } else if (rec.freq === 'monthly') {
    if (rec.monthlyMode === 'nth') {
      const nth = Math.ceil(start.getDate() / 7);
      const wd = WEEKDAY_LABEL[WEEKDAY_CODES[start.getDay()]];
      base = `${everyN}month${rec.interval > 1 ? 's' : ''} on the ${ordinal(nth)} ${wd}`;
    } else {
      base = `${everyN}month${rec.interval > 1 ? 's' : ''} on day ${start.getDate()}`;
    }
  } else if (rec.freq === 'yearly') {
    base = `${everyN}year${rec.interval > 1 ? 's' : ''}`;
  }

  if (rec.endKind === 'count' && rec.count) {
    base += ` · ${rec.count} occurrences`;
  } else if (rec.endKind === 'until' && rec.until) {
    base += ` · until ${new Date(rec.until).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  return base;
}

export function generateOccurrences(
  rec: Recurrence,
  startLocal: string,
  limit = 20,
): Date[] {
  if (!startLocal || rec.freq === 'none') return [];
  const start = new Date(startLocal);
  const out: Date[] = [];
  const max =
    rec.endKind === 'count' && rec.count ? Math.min(rec.count, limit) : limit;
  const untilDate =
    rec.endKind === 'until' && rec.until ? new Date(rec.until) : null;

  if (rec.freq === 'daily') {
    const cur = new Date(start);
    while (out.length < max) {
      if (untilDate && cur > untilDate) break;
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + rec.interval);
    }
    return out;
  }

  if (rec.freq === 'weekly') {
    const days = rec.byday.length
      ? rec.byday.map((d) => WEEKDAY_CODES.indexOf(d))
      : [start.getDay()];
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    // Iterate week blocks. Within each block, emit each target weekday at start's time-of-day.
    let weekIdx = 0;
    while (out.length < max) {
      for (const wd of days.slice().sort((a, b) => a - b)) {
        const candidate = new Date(weekStart);
        candidate.setDate(weekStart.getDate() + weekIdx * 7 * rec.interval + wd);
        candidate.setHours(start.getHours(), start.getMinutes(), 0, 0);
        if (candidate < start) continue;
        if (untilDate && candidate > untilDate) return out;
        out.push(candidate);
        if (out.length >= max) return out;
      }
      weekIdx += 1;
      if (weekIdx > 520) break; // hard cap ≈10 years
    }
    return out;
  }

  if (rec.freq === 'monthly') {
    const cur = new Date(start);
    let safety = 0;
    while (out.length < max && safety < 240) {
      safety += 1;
      if (rec.monthlyMode === 'nth') {
        const nth = Math.ceil(start.getDate() / 7);
        const wd = start.getDay();
        const target = nthWeekdayOfMonth(cur.getFullYear(), cur.getMonth(), nth, wd);
        if (target) {
          target.setHours(start.getHours(), start.getMinutes(), 0, 0);
          if (target >= start && (!untilDate || target <= untilDate)) {
            out.push(target);
          } else if (untilDate && target > untilDate) {
            break;
          }
        }
      } else {
        const day = start.getDate();
        const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
        if (day <= lastDay) {
          const target = new Date(
            cur.getFullYear(),
            cur.getMonth(),
            day,
            start.getHours(),
            start.getMinutes(),
          );
          if (target >= start && (!untilDate || target <= untilDate)) {
            out.push(target);
          } else if (untilDate && target > untilDate) {
            break;
          }
        }
      }
      cur.setMonth(cur.getMonth() + rec.interval);
    }
    return out;
  }

  if (rec.freq === 'yearly') {
    const cur = new Date(start);
    while (out.length < max) {
      if (untilDate && cur > untilDate) break;
      out.push(new Date(cur));
      cur.setFullYear(cur.getFullYear() + rec.interval);
    }
    return out;
  }

  return out;
}

/** Best-effort RRULE → human summary for display. Falls back to the raw rule. */
export function rruleToHuman(rrule: string, startIso: string): string {
  const parts = Object.fromEntries(
    rrule.split(';').map((seg) => {
      const [k, v] = seg.split('=');
      return [k.toUpperCase(), v ?? ''];
    }),
  );
  const freq = (parts.FREQ ?? '').toLowerCase();
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(freq)) return rrule;
  const interval = Number(parts.INTERVAL ?? 1) || 1;
  const byday = (parts.BYDAY ?? '').split(',').filter(Boolean);
  const count = parts.COUNT ? Number(parts.COUNT) : undefined;
  const untilStamp = parts.UNTIL;

  const start = new Date(startIso);
  const rec: Recurrence = {
    freq: freq as Frequency,
    interval,
    byday: byday
      .map((b) => b.replace(/^[-\d]+/, '') as WeekdayCode)
      .filter((c) => (WEEKDAY_CODES as readonly string[]).includes(c)),
    monthlyMode:
      freq === 'monthly' && byday.length && /^[-\d]+/.test(byday[0]) ? 'nth' : 'date',
    endKind: count ? 'count' : untilStamp ? 'until' : 'never',
    count,
    until: untilStamp ? parseRruleStamp(untilStamp) : undefined,
  };
  return summarize(rec, start.toISOString());
}

function parseRruleStamp(s: string): string | undefined {
  // "20260801T180000Z" → ISO
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, se] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se)).toISOString();
}

export function formatExdateUtc(d: Date): string {
  return formatUtcStamp(d);
}

export function isSameInstant(a: Date | string, b: Date | string): boolean {
  const ta = (a instanceof Date ? a : new Date(a)).getTime();
  const tb = (b instanceof Date ? b : new Date(b)).getTime();
  return ta === tb;
}

function formatUtcStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  if (n === 4) return '4th';
  return 'last';
}

function nthWeekdayOfMonth(
  year: number,
  monthIdx: number,
  nth: number,
  weekday: number,
): Date | null {
  const first = new Date(year, monthIdx, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  if (day > lastDay) return null;
  return new Date(year, monthIdx, day);
}
