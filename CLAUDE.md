@AGENTS.md

# InviteWave — Architecture & Collaboration Guide

A SaaS that sends bulk calendar invites through users' own SMTP servers.

---

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (max-warnings 0)
npx tsc --noEmit # Type check
```

---

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (editorial brutalism overrides)
- **Supabase** — Auth, Postgres, Vault (pgsodium), RLS
- **Supabase clients** — `@supabase/supabase-js` + `@supabase/ssr`
- **`nodemailer`** for SMTP verify + send
- **`zod`** for validation, **`react-hook-form`** for client forms
- **`sonner`** for toasts, **`lucide-react`** for icons
- Fonts via `next/font/google`: **Anton** (display), **DM Sans** (body), **Caveat** (hand annotation)

### Do NOT install
- Any ORM (Prisma, Drizzle) — use SQL migrations + supabase-js + generated types
- NextAuth — Supabase Auth handles it
- Resend/SendGrid/Postmark — users bring their own SMTP
- Any queue framework — none yet this phase

---

## Next.js 16 specifics (load-bearing)

- `middleware.ts` is **deprecated** → renamed to **`proxy.ts`** with `export function proxy(...)`. Lives at `src/proxy.ts` (same level as `src/app`).
- Server Actions execute as **POST on their own route** → the proxy matcher catches them, but **always re-check `auth.getUser()` inside each Server Action**. Defense in depth.
- `cookies()` from `next/headers` is **async** — `await cookies()` in `lib/supabase/server.ts`.
- Before writing new Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

---

## File & Folder Structure

```
.
├── src/
│   ├── app/                          # App Router — pages, layouts, server actions, route handlers
│   │   ├── (app)/                    # Authenticated route group
│   │   │   ├── layout.tsx            # Sidebar shell, guards auth
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── smtp/
│   │   │           ├── page.tsx         # List
│   │   │           ├── _actions.ts      # verifySmtpConfig, delete, setDefault
│   │   │           ├── row-actions.tsx  # Client dropdown
│   │   │           ├── schema.ts        # zod + GMAIL preset
│   │   │           └── new/
│   │   │               ├── page.tsx
│   │   │               └── form.tsx     # Client form (react-hook-form)
│   │   ├── auth/                     # Sign-up/in/out, password reset, OAuth callback
│   │   │   ├── layout.tsx            # Editorial split cover
│   │   │   ├── _actions.ts           # signUp, signIn, signOut, reset, updatePassword
│   │   │   ├── heading.tsx
│   │   │   ├── google-button.tsx
│   │   │   ├── callback/route.ts
│   │   │   ├── sign-in/ | sign-up/ | forgot/ | reset/ | check-email/
│   │   ├── layout.tsx                # Root layout + fonts
│   │   ├── page.tsx                  # Root redirect → /dashboard
│   │   └── globals.css               # Editorial tokens + shadcn var mapping
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (sharp 2px corners, editorial overrides)
│   │   └── editorial/                # Editorial design-system pieces
│   │       ├── annotations.tsx       # UnderlineScribble, OvalEnclosure, ArrowPointer, Starburst
│   │       └── primitives.tsx        # MetaBar, Tag, VerticalLabel, Display, Underlined, Divider, YearMark
│   │
│   ├── constants/                    # App-wide constants — one file per domain
│   │   └── routes.ts                 # ROUTES, PROTECTED_PREFIXES
│   │
│   ├── data/                         # Server-only data access (reads). Marked `import 'server-only'`.
│   │   └── smtp.ts                   # listSmtpConfigs, countSmtpConfigs
│   │
│   ├── lib/
│   │   ├── supabase/                 # SSR client helpers
│   │   │   ├── server.ts             # createServerClient (RSC, Server Actions, Route Handlers)
│   │   │   ├── client.ts             # createBrowserClient (Client Components only)
│   │   │   └── proxy.ts              # updateSession used by proxy.ts
│   │   └── utils.ts                  # cn() + small pure helpers
│   │
│   ├── types/                        # Global TypeScript types
│   │   └── supabase.ts               # Database type — regenerate via `supabase gen types`
│   │
│   └── proxy.ts                      # Next 16 proxy (replaces middleware.ts)
│
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql             # profiles, smtp_configs, RLS, trigger
│       └── 0002_smtp_rpc.sql         # create_smtp_config, delete_smtp_config
│
├── components.json                   # shadcn config (css: src/app/globals.css)
├── tsconfig.json                     # paths: "@/*": ["./src/*"]
├── AGENTS.md                         # Next.js 16 reminder
└── CLAUDE.md                         # This file
```

### Path alias
`@/*` resolves to `./src/*`. Always import via `@/…` from anywhere under `src/`.

### Folder conventions
- **Underscore prefix** (`_actions.ts`, `_components/`) marks files App Router will **not route**. Use for co-located server actions and private helpers.
- **Route groups** like `(app)` group routes without adding URL segments — used to scope auth shell.
- **One file per feature surface.** Don't create files just to name a chunk.
- **No barrel files (`index.ts` re-exports).** Import directly.

---

## Data flow — App Router idioms

This is an App Router app. **Do NOT recreate a Pages-Router-style `models/` layer that calls `fetch('/api/...')`** — that pattern is for client-heavy apps. Here:

| Operation | Where it lives | Pattern |
|---|---|---|
| **Read** (page load) | `src/data/<domain>.ts` | Server-only function called from a Server Component. Calls `createClient()` from `@/lib/supabase/server`. |
| **Write / mutation** | `src/app/**/_actions.ts` | `'use server'` Server Action co-located with the feature. Called from Client Components. |
| **Auth state mutation** (sign in/out) | `src/app/auth/_actions.ts` | Same as above. |
| **OAuth code exchange** | `src/app/auth/callback/route.ts` | Route Handler — needed because the OAuth flow redirects with a query param. |

### Rules

- **Server Components read.** Never fetch in `useEffect` what you can fetch in a Server Component.
- **Client Components mutate** via Server Actions imported directly.
- **Never create a `/api/…` route** unless you genuinely need an external HTTP surface (webhooks, third-party callbacks, OAuth). Server Actions cover internal mutations.
- **Always verify `auth.getUser()` inside every Server Action.** Proxy is defense in depth, not the only line.
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** It belongs only in Server Actions, Route Handlers, and (future) worker processes.
- **Never store SMTP passwords in a column.** They go through `create_smtp_config` RPC → Supabase Vault. The only plaintext touchpoint is the RPC parameter, which immediately calls `vault.create_secret` and discards.

### Example — read

```ts
// src/data/smtp.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function listSmtpConfigs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('smtp_configs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

```tsx
// src/app/(app)/settings/smtp/page.tsx
import { listSmtpConfigs } from '@/data/smtp';

export default async function SmtpListPage() {
  const configs = await listSmtpConfigs();
  // …
}
```

### Example — write

```ts
// src/app/(app)/settings/smtp/_actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';

export async function deleteSmtpConfig(configId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not authenticated' };
  // …
}
```

---

## Auth flow

1. **Sign-up / sign-in** — `src/app/auth/_actions.ts` calls `supabase.auth.signUp` / `signInWithPassword`.
2. **OAuth (Google)** — `google-button.tsx` (client) calls `supabase.auth.signInWithOAuth`; the provider redirects to `src/app/auth/callback/route.ts` which calls `exchangeCodeForSession` and redirects to `next` or `/dashboard`.
3. **Proxy** (`src/proxy.ts`) refreshes the session on every request, redirects unauthenticated requests for `PROTECTED_PREFIXES` to `/auth/sign-in`, and bounces authed users away from `/auth/*` (except callback).
4. **Per-page guard** — every Server Component under `(app)/` calls `auth.getUser()` and redirects if absent. Belt + suspenders with the proxy.

`profiles` rows are created by the `on_auth_user_created` trigger — never insert manually.

---

## Constants (`src/constants/`)

Every route literal, magic string, or domain enum used in more than one place lives here.

```ts
// src/constants/routes.ts
export const ROUTES = {
  signIn: '/auth/sign-in',
  dashboard: '/dashboard',
  smtpNew: '/settings/smtp/new',
  // …
} as const;
```

Never inline `'/auth/sign-in'` in a component or redirect.

---

## Helpers (`src/lib/`)

Pure utility functions and SDK wrappers. **No React, no JSX, no global side effects.** `lib/supabase/*` is the only sub-module that constructs clients (each call returns a fresh per-request client — never reuse across requests).

---

## Design system — Editorial brutalism

Full reference is loaded into agent memory: see `~/.claude/projects/.../memory/design_system_editorial.md`. Source spec: `/Users/sid/Downloads/design-system.md`.

### Palette (CSS custom properties — `src/app/globals.css`)

| Token | Hex | Usage |
|---|---|---|
| `--color-electric-blue` | `#2B2BFF` | Primary accent. **Accent only — never large background.** |
| `--color-ink-black` | `#0A0A0A` | Body text, dark panels, primary button bg |
| `--color-paper-white` | `#F7F6F2` | Page background |
| `--color-pure-white` | `#FFFFFF` | Cards |
| `--color-gray-100/300/600/900` | various | Neutrals |

shadcn vars (`--primary`, `--background`, `--accent`, `--ring`, …) are **remapped** to this palette. Don't add new hex values in components — use the tokens.

### Typography

| Font | When |
|---|---|
| **Anton** (`var(--font-display-anton)`, utility `.font-display`) | Display headlines. Lowercase preferred. Letter-spacing `-0.02em` to `-0.04em`. Line-height `0.88–0.95`. |
| **DM Sans** (`var(--font-body)`) | All body, UI, labels |
| **Caveat** (`var(--font-hand-caveat)`, utility `.font-hand`) | Hand annotations, callouts |

### Annotations

`src/components/editorial/annotations.tsx` exports `UnderlineScribble`, `OvalEnclosure`, `ArrowPointer`, `Starburst`. **Always blue, 2–3.5px stroke, max 1–2 per section.**

### Utility classes

- `.editorial-meta` — uppercase tracked 11px meta bar text
- `.editorial-tag(-solid)` — pill labels
- `.editorial-vlabel` — rotated vertical section labels
- `.editorial-photo` — `grayscale(100%) contrast(1.15)`

### Contrast & hover rules (load-bearing)

- **Light bg → dark text.** Body text uses `--color-ink-black`. **Don't use gray for body.** Gray is for tiny meta only (page numbers, captions).
- **Dark bg → light text.** Sidebar bg = ink-black; nav text = gray-300 → paper-white on hover.
- **Hover invert via electric-blue accent.** Primary buttons go ink-black → **electric-blue + pure-white** on hover. Outline buttons invert to ink-black bg + paper-white text. Destructive items go from blue text → blue bg + white text.
- Placeholders are gray-600 (explicit in `Input`) so they stay distinguishable from filled text.

### Corners
Near-square. `--radius-*` are capped at 2–4px. Never use `rounded-xl|2xl|full` (except for genuinely circular badges).

---

## Component rules

- **One component per file.** If a file exports more than one, split it.
- **No barrel files.** Import directly.
- **Shared components in `components/editorial/` are zero-logic.**
- **Layout components (`(app)/layout.tsx`, `auth/layout.tsx`) are shells — they don't fetch data beyond auth checks.**
- **Components receive data via props or `await`** in Server Components — they never fetch in `useEffect`.
- **No `useEffect` for derived state.** Compute inline or use `useMemo`.
- **Inline vs extract** — only extract a sub-component when it's reused OR meaningfully improves separation. If used once and small, keep it inline. Don't extract to name a chunk.
- **Early returns over nested ternaries.**

```tsx
// ✅ Good
if (loading) return <Skeleton />;
if (configs.length === 0) return <EmptyState />;
return <ConfigList configs={configs} />;
```

---

## Forms

- **Client forms with validation** → `react-hook-form` + `zodResolver`. Server Action called from `onSubmit`, never via a route.
- **Simple auth forms** (sign-in, sign-up) → `useActionState` with the Server Action. Plain FormData.
- **Loading state** is the Server Action result (toasts via `sonner`). Don't reinvent.
- **Server-side validation** with the same Zod schema as the client. Never trust client validation alone.

---

## SMTP-specific rules (don't forget these)

- **Only Gmail this phase.** UI does not expose a provider switcher. Host/port/encryption are locked + hidden inputs always overwritten to GMAIL constants in the Server Action.
- **Verify flow is three sequential checks**: Zod → `nodemailer.verify()` → **real test email to the user's own inbox**. `nodemailer.verify()` alone is not proof; real send is.
- **Test emails are sent BEFORE the row is persisted.** No half-saved configs.
- **App Passwords required.** Gmail rejects regular passwords over SMTP. UI must show the warning + link to `myaccount.google.com/apppasswords`.
- **Re-test of existing configs is intentionally limited.** Decrypting the Vault secret requires a server-only RPC that lives in the future worker phase. Until then: re-add to re-test.

---

## Code quality rules

- **Never `any`.** Use `unknown` + narrowing, or define a type in `src/types/`.
- No unused imports — `npm run lint` must pass with `--max-warnings 0`.
- No commented-out code — delete it.
- No magic strings inline — `src/constants/`.
- No `console.log` in production code.
- Keep files under ~250 lines — split when longer.
- `const` arrow functions for components; named exports.
- Default to writing **no comments**. Only add one when the WHY is non-obvious (a hidden invariant, a workaround, a constraint not obvious from the code).
- Don't write `// what this does` comments — well-named identifiers do that.
- Don't reference the current task in comments — that's PR description material.

---

## Environment

`.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...   # server only
```

After any DB migration: `supabase gen types typescript --linked > src/types/supabase.ts`.
