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
