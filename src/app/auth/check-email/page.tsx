import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { AuthHeading } from '../heading';
import { ArrowPointer } from '@/components/editorial/annotations';

export const metadata = { title: 'check your email — invitewave' };

export default function CheckEmailPage() {
  return (
    <div>
      <AuthHeading
        step="01 · verify"
        title="check your inbox."
        underline="inbox"
        description="We sent a verification link. Click it to finish signing up."
      />
      <div className="flex items-center gap-3 text-[var(--color-ink-black)] text-sm">
        <ArrowPointer className="h-5 w-12" />
        <span className="font-hand text-xl text-[var(--color-electric-blue)]">
          can take a minute
        </span>
      </div>
      <p className="mt-10 text-sm text-[var(--color-ink-black)]">
        Already verified?{' '}
        <Link className="text-[var(--color-electric-blue)] hover:underline" href={ROUTES.signIn}>
          sign in →
        </Link>
      </p>
    </div>
  );
}
