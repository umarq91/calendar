'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export function GoogleButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const params = new URLSearchParams();
    if (next) params.set('next', next);
    const redirectTo = `${origin}/auth/callback${params.toString() ? `?${params}` : ''}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setLoading(false);
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={loading}>
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </Button>
  );
}
