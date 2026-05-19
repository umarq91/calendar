import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Check your email — InviteWave' };

export default function CheckEmailPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a verification link. Click it to finish signing up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500">
          Already verified?{' '}
          <Link className="text-zinc-900 dark:text-zinc-50 hover:underline" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
