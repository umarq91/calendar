'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updatePassword, type AuthActionResult } from '../_actions';

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthActionResult | undefined, FormData>(
    updatePassword,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" className="w-full h-11" disabled={pending}>
        {pending ? 'Updating…' : 'Update password →'}
      </Button>
    </form>
  );
}
