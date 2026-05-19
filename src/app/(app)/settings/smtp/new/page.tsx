import { SmtpForm } from './form';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tag, Divider } from '@/components/editorial/primitives';

export const metadata = { title: 'add smtp — invitewave' };

export default function NewSmtpPage() {
  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 uppercase tracking-[0.08em]">
        <Link href={ROUTES.smtp}>
          <ArrowLeft className="h-4 w-4" />
          back
        </Link>
      </Button>
      <Tag>04 · settings / smtp / new</Tag>
      <h1 className="font-display mt-5 text-[4rem] sm:text-[4.75rem] leading-[0.92] tracking-[-0.03em] lowercase">
        connect
        <br />
        gmail smtp.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
        We&apos;ll verify the connection and send a test email to your inbox
        before saving anything.
      </p>
      <Divider className="my-10" />
      <SmtpForm />
    </div>
  );
}
