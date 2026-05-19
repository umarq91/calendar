import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpForm } from './form';
import { GoogleButton } from '../google-button';

export const metadata = { title: 'Sign up — InviteWave' };

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start sending invites in minutes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignUpForm />
        <div className="relative text-center text-xs uppercase tracking-wide text-zinc-500">
          <span className="bg-card px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <GoogleButton />
        <p className="text-sm text-center text-zinc-500">
          Already have an account?{' '}
          <Link className="text-zinc-900 dark:text-zinc-50 hover:underline" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
