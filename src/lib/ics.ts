/**
 * Minimal RFC 5545 ICS builder for calendar invites (METHOD:REQUEST).
 * Pure — no I/O. Pass into nodemailer's `icalEvent` option.
 */

export type IcsInput = {
  uid: string;
  /** Event start (Date or ISO string). */
  start: Date | string;
  /** Event end (Date or ISO string). Must be after start. */
  end: Date | string;
  summary: string;
  description?: string;
  location?: string;
  organizer: { name?: string; email: string };
  attendees: { name?: string; email: string }[];
  /** Defaults to now. */
  dtstamp?: Date;
};

const CRLF = '\r\n';
const PRODID = '-//Lets Calendar Clone//EN';

export function buildIcs(input: IcsInput): string {
  const dtstamp = formatUtc(input.dtstamp ?? new Date());
  const dtstart = formatUtc(toDate(input.start));
  const dtend = formatUtc(toDate(input.end));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(input.summary)}`,
    organizerLine(input.organizer),
    ...input.attendees.map(attendeeLine),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeText(input.location)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR', '');
  return lines.map(foldLine).join(CRLF);
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

/** RFC 5545 UTC date-time: YYYYMMDDTHHMMSSZ */
function formatUtc(d: Date): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape commas, semicolons, backslashes, newlines per RFC 5545 §3.3.11. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function organizerLine({ name, email }: { name?: string; email: string }): string {
  return name
    ? `ORGANIZER;CN=${escapeText(name)}:mailto:${email}`
    : `ORGANIZER:mailto:${email}`;
}

function attendeeLine({ name, email }: { name?: string; email: string }): string {
  const cn = name ? `;CN=${escapeText(name)}` : '';
  return `ATTENDEE${cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`;
}

/** Fold lines longer than 75 octets per RFC 5545 §3.1. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push(i === 0 ? chunk : ` ${chunk}`);
    i += i === 0 ? 75 : 74;
  }
  return out.join(CRLF);
}
