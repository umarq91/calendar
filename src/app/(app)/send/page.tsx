import Link from 'next/link';
import { getDefaultSmtpForCurrentUser } from '@/data/smtp';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Tag, Divider } from '@/components/editorial/primitives';
import { Mail } from 'lucide-react';
import { SendInviteForm } from './form';

export const metadata = { title: 'send invite — let’s calendar' };

export default async function SendPage() {
  const smtp = await getDefaultSmtpForCurrentUser();

  if (!smtp) {
    return (
      <div className="max-w-3xl">
        <Tag>02 · send invite</Tag>
        <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
          connect smtp
          <br />
          first.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
          You need a verified SMTP connection before you can send invites.
        </p>
        <Divider className="my-12" />
        <div className="border border-dashed border-[var(--color-gray-300)] bg-[var(--color-pure-white)] p-10 text-center">
          <Mail className="h-6 w-6 mx-auto text-[var(--color-electric-blue)]" />
          <h2 className="font-display mt-4 text-[2rem] leading-[0.95] tracking-[-0.02em] lowercase">
            no smtp configured.
          </h2>
          <Button asChild className="mt-6 h-11 px-5">
            <Link href={ROUTES.smtpNew}>connect smtp →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Tag>02 · send invite</Tag>
      <h1 className="font-display mt-5 text-[4rem] sm:text-[5rem] leading-[0.92] tracking-[-0.03em] lowercase">
        send a
        <br />
        calendar invite.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] text-[var(--color-ink-black)] leading-relaxed">
        One event, many recipients. Each gets a personalized email with an RSVP
        card. Sent through your verified Gmail connection.
      </p>
      <Divider className="my-10" />
      <SendInviteForm
        fromName={smtp.from_name}
        fromEmail={smtp.from_email}
        smtpLabel={smtp.label}
      />
    </div>
  );
}
