'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn, type AuthActionResult } from '../_actions';

export function SignInForm({ next, oauthError }: { next?: string; oauthError?: string }) {
  const [state, action, pending] = useActionState<AuthActionResult | undefined, FormData>(
    signIn,
    oauthError ? { error: oauthError } : undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link className="text-xs text-zinc-500 hover:underline" href="/auth/forgot">
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
