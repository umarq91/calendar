import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Toaster } from '@/components/ui/sonner';
import { MetaBar, VerticalLabel, YearMark } from '@/components/editorial/primitives';
import { Starburst } from '@/components/editorial/annotations';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-[var(--color-paper-white)]">
      {/* Left — editorial cover panel */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-[var(--color-ink-black)] text-[var(--color-paper-white)] p-12 overflow-hidden">
        <MetaBar
          left={<span>invitewave · 2025</span>}
          right={<span>auth · /001</span>}
          className="text-[var(--color-gray-300)]"
        />

        <div className="relative">
          <Starburst
            size={72}
            className="absolute -top-12 -left-2 opacity-90"
          />
          <h1 className="font-display text-[7rem] xl:text-[8.5rem] leading-[0.85] tracking-[-0.04em] lowercase">
            bulk
            <br />
            invites,
            <br />
            <span className="text-[var(--color-electric-blue)]">your</span> smtp.
          </h1>
          <p className="font-body mt-8 max-w-md text-[var(--color-gray-300)] text-base leading-relaxed">
            Calendar invites at scale through the mail server you already own.
            No deliverability black box. No price per send.
          </p>
        </div>

        <div className="flex items-end justify-between text-[var(--color-gray-300)]">
          <YearMark />
          <Link
            href={ROUTES.signIn}
            className="editorial-meta hover:text-[var(--color-paper-white)] transition-colors"
          >
            ← back to sign in
          </Link>
        </div>

        <VerticalLabel
          className="absolute right-6 top-1/2 -translate-y-1/2"
          size="3.5rem"
        >
          welcome
        </VerticalLabel>
      </aside>

      {/* Right — form panel */}
      <main className="relative flex flex-col px-6 sm:px-12 lg:px-16 py-10">
        <MetaBar
          left={
            <Link href={ROUTES.signIn} className="hover:text-[var(--color-ink-black)]">
              invitewave
            </Link>
          }
          right={<span>2025</span>}
        />
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}
