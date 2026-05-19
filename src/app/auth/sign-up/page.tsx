import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { SignUpForm } from './form';
import { GoogleButton } from '../google-button';
import { AuthHeading } from '../heading';
import { Divider } from '@/components/editorial/primitives';

export const metadata = { title: 'sign up — invitewave' };

export default function SignUpPage() {
  return (
    <div>
      <AuthHeading
        step="01 · sign up"
        title="start sending."
        underline="sending"
        description="Create an account. We'll send a verification email."
      />
      <SignUpForm />
      <Divider className="my-6" />
      <GoogleButton />
      <p className="mt-6 text-sm text-[var(--color-ink-black)]">
        Already have an account?{' '}
        <Link className="text-[var(--color-electric-blue)] hover:underline" href={ROUTES.signIn}>
          sign in →
        </Link>
      </p>
    </div>
  );
}
