import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '@/app/auth/_actions';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { MetaBar, VerticalLabel } from '@/components/editorial/primitives';
import { Calendar, LayoutDashboard, Send, Users, Settings, LogOut } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const NAV = [
  { href: ROUTES.dashboard, label: '01 · dashboard', icon: LayoutDashboard },
  { href: ROUTES.send, label: '02 · send invite', icon: Send },
  { href: ROUTES.contacts, label: '03 · contacts', icon: Users },
  { href: ROUTES.campaigns, label: '04 · campaigns', icon: Calendar },
  { href: ROUTES.smtp, label: '05 · settings', icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  return (
    <div className="min-h-screen flex bg-[var(--color-paper-white)] text-[var(--color-ink-black)]">
      <aside className="w-72 shrink-0 bg-[var(--color-ink-black)] text-[var(--color-paper-white)] flex flex-col">
        <div className="px-8 py-7">
          <Link
            href={ROUTES.dashboard}
            className="font-display text-[2rem] leading-none tracking-[-0.03em] lowercase"
          >
            invitewave
          </Link>
          <div className="editorial-meta mt-2 text-[var(--color-gray-300)]">
            v0.1 · 2025
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 px-4 py-2.5 text-[13px] tracking-[0.04em] text-[var(--color-gray-300)] hover:bg-[var(--color-electric-blue)] hover:text-[var(--color-pure-white)] transition-colors"
            >
              <Icon className="h-4 w-4 text-[var(--color-electric-blue)] group-hover:text-[var(--color-pure-white)]" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--color-gray-900)] p-4 space-y-3">
          <div className="px-2">
            <div className="editorial-meta text-[var(--color-gray-300)]">signed in</div>
            <div
              className="mt-1 text-[13px] text-[var(--color-paper-white)] truncate"
              title={user.email ?? ''}
            >
              {user.email}
            </div>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent border-[var(--color-gray-300)] text-[var(--color-gray-300)] hover:bg-[var(--color-electric-blue)] hover:text-[var(--color-pure-white)] hover:border-[var(--color-electric-blue)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 relative">
        <div className="px-10 lg:px-14 py-8 border-b border-[var(--color-gray-300)]">
          <MetaBar
            left={<span>invitewave · 2025</span>}
            right={<span>signed · {user.email}</span>}
          />
        </div>
        <div className="relative px-10 lg:px-14 py-12">
          <VerticalLabel
            className="absolute right-6 top-12 hidden xl:block"
            size="2rem"
          >
            workspace
          </VerticalLabel>
          {children}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}
