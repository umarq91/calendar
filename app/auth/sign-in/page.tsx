import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignInForm } from './form';
import { GoogleButton } from '../google-button';

export const metadata = { title: 'Sign in — InviteWave' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to InviteWave.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignInForm next={next} oauthError={error === 'oauth_failed' ? 'Google sign-in failed. Try again.' : undefined} />
        <div className="relative text-center text-xs uppercase tracking-wide text-zinc-500">
          <span className="bg-card px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <GoogleButton next={next} />
        <p className="text-sm text-center text-zinc-500">
          New here?{' '}
          <Link className="text-zinc-900 dark:text-zinc-50 hover:underline" href="/auth/sign-up">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
