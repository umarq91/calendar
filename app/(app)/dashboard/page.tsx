import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Dashboard — InviteWave' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from('smtp_configs')
    .select('id', { count: 'exact', head: true });

  const hasSmtp = (count ?? 0) > 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome{user?.email ? `, ${user.email}` : ''}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          One last step before you send invites.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{hasSmtp ? 'SMTP connected' : 'Connect your SMTP'}</CardTitle>
          <CardDescription>
            {hasSmtp
              ? 'You can manage your connections in Settings.'
              : 'InviteWave sends through your own SMTP server. Add one to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={hasSmtp ? '/settings/smtp' : '/settings/smtp/new'}>
              {hasSmtp ? 'Manage SMTP' : 'Connect SMTP'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
