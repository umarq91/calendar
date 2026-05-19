import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ForgotForm } from './form';
import { AuthHeading } from '../heading';

export const metadata = { title: 'reset password — invitewave' };

export default function ForgotPage() {
  return (
    <div>
      <AuthHeading
        step="03 · reset"
        title="forgot password?"
        underline="forgot"
        description="We'll email you a reset link."
      />
      <ForgotForm />
      <p className="mt-6 text-sm text-[var(--color-ink-black)]">
        Remembered it?{' '}
        <Link className="text-[var(--color-electric-blue)] hover:underline" href={ROUTES.signIn}>
          sign in →
        </Link>
      </p>
    </div>
  );
}
