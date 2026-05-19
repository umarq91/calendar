import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotForm } from './form';

export const metadata = { title: 'Reset password — InviteWave' };

export default function ForgotPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotForm />
        <p className="text-sm text-center text-zinc-500">
          Remembered it?{' '}
          <Link className="text-zinc-900 dark:text-zinc-50 hover:underline" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
