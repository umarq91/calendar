import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '../auth/_actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Calendar, LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: Calendar },
  { href: '/settings/smtp', label: 'Settings', icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="px-6 py-5">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            InviteWave
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-3 space-y-2">
          <div className="px-3 text-xs text-zinc-500 truncate" title={user.email ?? ''}>
            {user.email}
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
      <Toaster richColors />
    </div>
  );
}
