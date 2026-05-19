import Link from 'next/link';
import { listSmtpConfigs } from '@/data/smtp';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { ConfigRowActions } from './row-actions';
import { CheckCircle2, Mail } from 'lucide-react';

export const metadata = { title: 'smtp — invitewave' };

export default async function SmtpListPage() {
  const configs = await listSmtpConfigs();

  return (
    <div className="max-w-4xl">
      <Tag>04 · settings / smtp</Tag>
      <div className="mt-5 flex items-end justify-between gap-8">
        <h1 className="font-display text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
          smtp
          <br />
          connections.
        </h1>
        <Button asChild size="lg" className="h-11 px-5">
          <Link href={ROUTES.smtpNew}>add smtp →</Link>
        </Button>
      </div>
      <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
        The mail server InviteWave sends through. We never store your password
        in plain text — it lives inside Supabase Vault.
      </p>

      <Divider className="my-12" />

      {configs.length === 0 ? (
        <div className="border border-dashed border-[var(--color-gray-300)] bg-[var(--color-pure-white)] p-10 text-center">
          <Mail className="h-6 w-6 mx-auto text-[var(--color-electric-blue)]" />
          <h2 className="font-display mt-4 text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
            no connections yet.
          </h2>
          <p className="mt-3 text-[14px] text-[var(--color-ink-black)] max-w-sm mx-auto">
            Gmail SMTP for now. More providers coming soon.
          </p>
          <Button asChild className="mt-6 h-11 px-5">
            <Link href={ROUTES.smtpNew}>connect first smtp →</Link>
          </Button>
        </div>
      ) : (
        <ol className="space-y-0 border-y border-[var(--color-gray-300)]">
          {configs.map((c, idx) => (
            <li
              key={c.id}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-6 py-5 border-b border-[var(--color-gray-300)] last:border-b-0"
            >
              <span className="font-display text-[var(--color-electric-blue)] text-[2rem] leading-none">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-[15px]">{c.label}</span>
                  {c.verified_at && (
                    <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-electric-blue)]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      verified
                    </span>
                  )}
                  {c.is_default && (
                    <Tag solid className="text-[10px]">default</Tag>
                  )}
                </div>
                <div className="mt-1 text-[13px] text-[var(--color-ink-black)] truncate">
                  {c.from_name} &lt;{c.from_email}&gt; · {c.host}:{c.port}
                  {c.secure ? ' (SSL)' : ' (STARTTLS)'}
                </div>
              </div>
              <ConfigRowActions configId={c.id} isDefault={c.is_default} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
