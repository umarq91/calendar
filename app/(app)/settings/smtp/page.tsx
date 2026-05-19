import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfigRowActions } from './row-actions';
import { CheckCircle2, Mail } from 'lucide-react';

export const metadata = { title: 'SMTP — InviteWave' };

export default async function SmtpListPage() {
  const supabase = await createClient();
  const { data: configs } = await supabase
    .from('smtp_configs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">SMTP connections</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Connect the mail server InviteWave should send through.
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/smtp/new">Add SMTP</Link>
        </Button>
      </div>

      {!configs || configs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              No connections yet
            </CardTitle>
            <CardDescription>
              Add Gmail, Outlook, Zoho, Yahoo, or any custom SMTP server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/smtp/new">Connect your first SMTP</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.label}</span>
                    {c.verified_at && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                    {c.is_default && (
                      <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500 truncate">
                    {c.from_name} &lt;{c.from_email}&gt; · {c.host}:{c.port}
                    {c.secure ? ' (SSL)' : ''}
                  </div>
                </div>
                <ConfigRowActions configId={c.id} isDefault={c.is_default} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
