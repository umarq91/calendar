'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestPasswordReset, type AuthActionResult } from '../_actions';

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthActionResult | undefined, FormData>(
    requestPasswordReset,
    undefined,
  );

  const sent = state !== undefined && !state.error;

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {sent && (
        <Alert>
          <AlertDescription>
            If an account exists for that email, a reset link is on its way.
          </AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
