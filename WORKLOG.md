# Work Log

Concise per-feature changelog. Append a new numbered entry each session. One feature per entry.

---

## Work 03 — Send one calendar invite

**Goal:** Smallest end-to-end slice that proves the product: pick a recipient + datetime + title → real calendar invite lands in their inbox with RSVP buttons.

### What

- **SQL** `supabase/migrations/0003_smtp_with_password_rpc.sql` — new `get_smtp_with_password(p_config_id)` RPC. SECURITY DEFINER, owner-only, grants to `authenticated`. Joins `smtp_configs` + `vault.decrypted_secrets`. Returns plaintext password to server only.
- **ICS lib** `src/lib/ics.ts` — pure RFC 5545 builder. VEVENT with UID, UTC DTSTAMP/DTSTART/DTEND, ORGANIZER, ATTENDEE (RSVP=TRUE), comma/semi/newline escaping, 75-octet line folding, `METHOD:REQUEST`.
- **Server action** `src/app/(app)/send/_actions.ts` — `sendInvite(input)`. Pipeline: auth → zod → resolve default SMTP → decrypt via RPC → build ICS → `nodemailer.sendMail` with `icalEvent`. Returns tagged result with `step`.
- **Data helper** `src/data/smtp.ts` — added `getDefaultSmtpForCurrentUser()`.
- **Schema** `src/app/(app)/send/schema.ts` — Zod: recipient, summary, optional desc/location, start/end local datetimes. Refine: end > start.
- **UI** `src/app/(app)/send/{page,form}.tsx` — Server page pre-fetches SMTP; empty state if none. Client form (RHF + zodResolver), three editorial Sections, defaults start = next 15-min slot.
- **Routes + nav** `ROUTES.send`, sidebar entry "02 · send invite", dashboard CTA flips to "send first invite →" once SMTP connected.
- **Types** `src/types/supabase.ts` — added `get_smtp_with_password` to `Functions`.

### How it works

1. User opens `/send`. Server Component loads default SMTP via `getDefaultSmtpForCurrentUser()`. No SMTP → empty state with CTA to `/settings/smtp/new`.
2. User fills recipient + event fields. Client form validates with the same Zod schema as the server.
3. On submit, `sendInvite` Server Action runs. It re-checks `auth.getUser()` (defense in depth — proxy isn't enough since Server Actions are POST on their route).
4. Action calls `get_smtp_with_password` RPC. RPC checks `auth.uid()` matches the config's `user_id` (owner-only) and returns the decrypted Vault password. Plaintext only exists on the server.
5. `buildIcs()` produces an RFC 5545 string. UTC times so clients don't drift across timezones.
6. `nodemailer.sendMail` uses `icalEvent: { method: 'REQUEST', ... }` — nodemailer adds the right `text/calendar; method=REQUEST` MIME parts, so Gmail/Outlook render the inline RSVP card instead of an attachment.
7. Result returned to client. Toast on success/error. Form resets event fields, keeps SMTP slot.

### Verified
- `tsc --noEmit`, `eslint --max-warnings 0`, `next build` all clean
- `/send` route + `Proxy (Middleware)` both registered

### Manual steps to enable
- `supabase db push` (apply migration 0003)
- Add Gmail SMTP at `/settings/smtp/new` if not already

---

## Work 04 — Bulk send + persisted events

**Goal:** Send one event to many recipients in one batch. Persist every batch + per-recipient delivery status so users can audit what went out.

### What
 - 0004_events.sql — events + event_recipients tables, owner-only RLS, event_recipient_status enum
  - src/lib/recipients.ts — pure parser (newline/comma/semicolon split, Name <email> support, dedupe, lowercase)
  - sendBulkInvite action — persists event + recipients before send, decrypt SMTP once, pooled transporter, 150ms throttle, per-row status updates, count rollup
  - /send form — multi-recipient textarea with live valid/duplicate/invalid chips + post-run results table linking to event 
  - /events list + /events/[id] detail with stats and per-recipient status (sent_at or error)
  - Nav cleaned: dropped placeholder contacts/campaigns, added 03 · events; dashboard roadmap reflects real state with strikethrough on done items
  - ICS unchanged — already supports multi-attendee
  - WORKLOG Work 04 appended
  - **CSV import** `src/lib/csv.ts` + `upload csv` button on send form. Auto-detects email column, skips header rows, supports quoted cells. Imported rows are appended into the recipients textarea (re-uses live parser + dedupe + validation)
  - src/lib/csv.ts — parseCsvToRecipientLines(text). Splits rows, quoted-cell safe, auto-detects email column per row, treats first non-email cell as name. Header rows drop naturally (no
  email cell).
  - /send form — upload csv outline button + hidden .csv/.txt file input. On select: reads, parses, appends to existing recipients textarea via setValue with shouldValidate. Toast confirms
  count or error.
  - **CSV format guide** collapsible `<details>` panel under upload button listing accepted shapes (email-only, `name,email`, `email,name`, quoted cells, optional header) with live example block + `download sample.csv` link that generates `recipients-sample.csv` client-side.


### How it works

1. User pastes recipients (one per line or comma/semicolon separated). Form parses live and shows valid/duplicate/invalid counts.
2. On submit, `sendBulkInvite` re-validates server-side, then writes the `events` row + N `event_recipients` rows in `pending` status before any mail goes out (audit trail even on partial failure).
3. Single ICS is built once with all attendees inside one VEVENT and a shared `ics_uid` — recipients see the roster and RSVPs collate under one organizer slot.
4. One pooled `nodemailer` transporter loops through recipients with a 150ms gap. Each `sendMail` uses the recipient as the To header so the inbox personalizes correctly. Each row is updated to `sent` (with messageId + sent_at) or `failed` (with error) inline.
5. After the loop, `events.sent_count` / `failed_count` are rolled up. Client gets per-recipient `results[]` and renders a status table with a link to the event detail.
6. `/events` lists past batches with delivery badge; `/events/[id]` shows event metadata + per-recipient table (status + sent_at or error).

### Verified
- `tsc --noEmit`, `eslint --max-warnings 0`, `next build` all clean
- `/send`, `/events`, `/events/[id]` routes registered; proxy still guards them

### Manual steps to enable
- `supabase db push` (apply migration 0004)
- Use `/send` to fire a small batch (e.g. 2–3 of your own addresses) — confirm each receives a personalized RSVP card and `/events/<id>` shows accurate per-recipient status

---

## Work 05 — Recurrence + exclusions

**Done**
- Events can now repeat (daily, weekly on chosen days, monthly by date or nth weekday, yearly).
- End condition: never, after N occurrences, or on a chosen date.
- Specific upcoming occurrences can be excluded from the series.
- Recurrence + exclusions persist on the event and surface on `/events/[id]`.
- Recipients' calendars (Gmail / Outlook / Apple) render the whole series natively from one invite.

**Manual steps**
- `supabase db push` (apply migration 0005)
