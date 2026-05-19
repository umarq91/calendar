import { SmtpForm } from './form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Add SMTP — InviteWave' };

export default function NewSmtpPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/settings/smtp">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-medium tracking-tight">Add SMTP connection</h1>
        <p className="text-sm text-zinc-500 mt-1">
          We&apos;ll verify the connection and send a test email to your inbox before saving.
        </p>
      </div>
      <SmtpForm />
    </div>
  );
}
