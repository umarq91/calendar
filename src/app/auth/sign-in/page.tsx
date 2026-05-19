import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { SignInForm } from './form';
import { GoogleButton } from '../google-button';
import { AuthHeading } from '../heading';
import { Divider } from '@/components/editorial/primitives';

export const metadata = { title: 'sign in — invitewave' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div>
      <AuthHeading
        step="02 · sign in"
        title="welcome back."
        underline="back"
        description="Sign in to manage your campaigns."
      />
      <SignInForm
        next={next}
        oauthError={error === 'oauth_failed' ? 'Google sign-in failed. Try again.' : undefined}
      />
      <Divider className="my-6" />
      <GoogleButton next={next} />
      <p className="mt-6 text-sm text-[var(--color-ink-black)]">
        New here?{' '}
        <Link className="text-[var(--color-electric-blue)] hover:underline" href={ROUTES.signUp}>
          create an account →
        </Link>
      </p>
    </div>
  );
}
